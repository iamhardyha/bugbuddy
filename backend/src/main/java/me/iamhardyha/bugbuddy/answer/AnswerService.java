package me.iamhardyha.bugbuddy.answer;

import me.iamhardyha.bugbuddy.answer.dto.AnswerCreateRequest;
import me.iamhardyha.bugbuddy.answer.dto.AnswerResponse;
import me.iamhardyha.bugbuddy.answer.dto.AnswerUpdateRequest;
import me.iamhardyha.bugbuddy.global.exception.BugBuddyException;
import me.iamhardyha.bugbuddy.global.response.ErrorCode;
import me.iamhardyha.bugbuddy.model.entity.Answer;
import me.iamhardyha.bugbuddy.model.entity.AnswerReaction;
import me.iamhardyha.bugbuddy.model.entity.Question;
import me.iamhardyha.bugbuddy.model.entity.UserEntity;
import me.iamhardyha.bugbuddy.model.entity.UserEntity;
import me.iamhardyha.bugbuddy.model.enums.MentorStatus;
import me.iamhardyha.bugbuddy.model.enums.QuestionStatus;
import me.iamhardyha.bugbuddy.model.enums.ReactionType;
import me.iamhardyha.bugbuddy.model.enums.ReferenceType;
import me.iamhardyha.bugbuddy.model.enums.SnapshotRole;
import me.iamhardyha.bugbuddy.repository.AnswerReactionRepository;
import me.iamhardyha.bugbuddy.repository.AnswerRepository;
import me.iamhardyha.bugbuddy.repository.QuestionRepository;
import me.iamhardyha.bugbuddy.repository.UserRepository;
import me.iamhardyha.bugbuddy.model.enums.XpEventType;
import me.iamhardyha.bugbuddy.upload.UploadService;
import me.iamhardyha.bugbuddy.xp.XpService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class AnswerService {

    private final AnswerRepository answerRepository;
    private final AnswerReactionRepository answerReactionRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final UploadService uploadService;
    private final XpService xpService;

    public AnswerService(
            AnswerRepository answerRepository,
            AnswerReactionRepository answerReactionRepository,
            QuestionRepository questionRepository,
            UserRepository userRepository,
            UploadService uploadService,
            XpService xpService
    ) {
        this.answerRepository = answerRepository;
        this.answerReactionRepository = answerReactionRepository;
        this.questionRepository = questionRepository;
        this.userRepository = userRepository;
        this.uploadService = uploadService;
        this.xpService = xpService;
    }

    @Transactional
    public AnswerResponse create(Long userId, Long questionId, AnswerCreateRequest request) {
        Question question = questionRepository.findActiveById(questionId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.QUESTION_NOT_FOUND));

        if (question.getStatus() == QuestionStatus.CLOSED) {
            throw new BugBuddyException(ErrorCode.QUESTION_ALREADY_CLOSED);
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.USER_NOT_FOUND));

        SnapshotRole snapshotRole = user.getMentorStatus() == MentorStatus.APPROVED
                ? SnapshotRole.MENTOR
                : SnapshotRole.USER;

        Answer answer = new Answer();
        answer.setQuestionId(questionId);
        answer.setAuthorUserId(userId);
        answer.setBody(request.body());
        answer.setAuthorSnapshotRole(snapshotRole);

        Answer saved = answerRepository.save(answer);
        uploadService.linkUploads(request.uploadIds(), userId, ReferenceType.ANSWER, saved.getId());
        xpService.grantXp(userId, XpEventType.ANSWER_CREATED, ReferenceType.ANSWER, saved.getId(), 5);
        return AnswerResponse.of(saved, 0L, false, user.getNickname());
    }

    public Page<AnswerResponse> findAllByQuestion(Long questionId, Long currentUserId, Pageable pageable) {
        questionRepository.findActiveById(questionId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.QUESTION_NOT_FOUND));

        Page<Answer> answers = answerRepository.findAllActiveByQuestionId(questionId, pageable);

        // 로그인한 유저의 반응 여부를 한 번의 쿼리로 일괄 조회
        Set<Long> reactedIds = currentUserId != null && !answers.isEmpty()
                ? answerReactionRepository.findReactedAnswerIds(
                        currentUserId,
                        ReactionType.HELPFUL,
                        answers.stream().map(Answer::getId).toList())
                : Collections.emptySet();

        return answers.map(a -> {
            long helpfulCount = answerReactionRepository
                    .countActiveByAnswerIdAndReactionType(a.getId(), ReactionType.HELPFUL);
            boolean myHelpful = reactedIds.contains(a.getId());
            return AnswerResponse.of(a, helpfulCount, myHelpful, getNickname(a.getAuthorUserId()));
        });
    }

    @Transactional
    public AnswerResponse update(Long userId, Long questionId, Long answerId, AnswerUpdateRequest request) {
        questionRepository.findActiveById(questionId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.QUESTION_NOT_FOUND));

        Answer answer = findActiveAnswerInQuestion(answerId, questionId);

        if (!answer.getAuthorUserId().equals(userId)) {
            throw new BugBuddyException(ErrorCode.ANSWER_FORBIDDEN);
        }

        answer.setBody(request.body());
        uploadService.linkUploads(request.uploadIds(), userId, ReferenceType.ANSWER, answerId);

        long helpfulCount = answerReactionRepository
                .countActiveByAnswerIdAndReactionType(answerId, ReactionType.HELPFUL);
        boolean myHelpful = answerReactionRepository
                .findActiveByAnswerIdAndVoterUserIdAndReactionType(answerId, userId, ReactionType.HELPFUL)
                .isPresent();
        return AnswerResponse.of(answer, helpfulCount, myHelpful, getNickname(answer.getAuthorUserId()));
    }

    @Transactional
    public void delete(Long userId, Long questionId, Long answerId) {
        questionRepository.findActiveById(questionId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.QUESTION_NOT_FOUND));

        Answer answer = findActiveAnswerInQuestion(answerId, questionId);

        if (!answer.getAuthorUserId().equals(userId)) {
            throw new BugBuddyException(ErrorCode.ANSWER_FORBIDDEN);
        }

        answer.softDelete();
    }

    @Transactional
    public AnswerResponse accept(Long userId, Long questionId, Long answerId) {
        Question question = questionRepository.findActiveById(questionId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.QUESTION_NOT_FOUND));

        if (!question.getAuthorUserId().equals(userId)) {
            throw new BugBuddyException(ErrorCode.ANSWER_ACCEPT_FORBIDDEN);
        }

        if (question.getStatus() == QuestionStatus.SOLVED) {
            throw new BugBuddyException(ErrorCode.QUESTION_ALREADY_SOLVED);
        }

        Answer answer = findActiveAnswerInQuestion(answerId, questionId);

        answer.setAccepted(true);
        question.setStatus(QuestionStatus.SOLVED);

        long helpfulCount = answerReactionRepository
                .countActiveByAnswerIdAndReactionType(answerId, ReactionType.HELPFUL);
        // 채택하는 사람은 질문 작성자이므로 myHelpful은 항상 false
        return AnswerResponse.of(answer, helpfulCount, false, getNickname(answer.getAuthorUserId()));
    }

    @Transactional
    public AnswerResponse addReaction(Long userId, Long questionId, Long answerId) {
        questionRepository.findActiveById(questionId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.QUESTION_NOT_FOUND));

        Answer answer = findActiveAnswerInQuestion(answerId, questionId);

        if (answer.getAuthorUserId().equals(userId)) {
            throw new BugBuddyException(ErrorCode.ANSWER_SELF_REACTION);
        }

        // soft-delete된 레코드 포함하여 조회 (유니크 제약 충돌 방지)
        AnswerReaction reaction = answerReactionRepository
                .findByAnswerIdAndVoterUserIdAndReactionType(answerId, userId, ReactionType.HELPFUL)
                .orElse(null);

        if (reaction != null && !reaction.isDeleted()) {
            throw new BugBuddyException(ErrorCode.ANSWER_REACTION_ALREADY_EXISTS);
        }

        if (reaction != null) {
            // soft-delete된 레코드 복원
            reaction.setDeletedAt(null);
        } else {
            // 최초 반응 생성
            reaction = new AnswerReaction();
            reaction.setAnswerId(answerId);
            reaction.setVoterUserId(userId);
            reaction.setReactionType(ReactionType.HELPFUL);
            answerReactionRepository.save(reaction);
        }

        xpService.grantXp(answer.getAuthorUserId(), XpEventType.ANSWER_HELPFUL_RECEIVED,
                ReferenceType.ANSWER, answerId, 20);

        long helpfulCount = answerReactionRepository
                .countActiveByAnswerIdAndReactionType(answerId, ReactionType.HELPFUL);
        return AnswerResponse.of(answer, helpfulCount, true, getNickname(answer.getAuthorUserId()));
    }

    @Transactional
    public AnswerResponse removeReaction(Long userId, Long questionId, Long answerId) {
        questionRepository.findActiveById(questionId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.QUESTION_NOT_FOUND));

        Answer answer = findActiveAnswerInQuestion(answerId, questionId);

        AnswerReaction reaction = answerReactionRepository
                .findActiveByAnswerIdAndVoterUserIdAndReactionType(answerId, userId, ReactionType.HELPFUL)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.ANSWER_REACTION_NOT_FOUND));

        reaction.softDelete();

        long helpfulCount = answerReactionRepository
                .countActiveByAnswerIdAndReactionType(answerId, ReactionType.HELPFUL);
        return AnswerResponse.of(answer, helpfulCount, false, getNickname(answer.getAuthorUserId()));
    }

    private Answer findActiveAnswerInQuestion(Long answerId, Long questionId) {
        Answer answer = answerRepository.findActiveById(answerId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.ANSWER_NOT_FOUND));

        if (!answer.getQuestionId().equals(questionId)) {
            throw new BugBuddyException(ErrorCode.ANSWER_NOT_FOUND);
        }

        return answer;
    }

    private String getNickname(Long userId) {
        return userRepository.findById(userId)
                .map(UserEntity::getNickname)
                .orElse("알 수 없음");
    }
}
