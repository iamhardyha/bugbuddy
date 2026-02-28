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
import me.iamhardyha.bugbuddy.model.enums.MentorStatus;
import me.iamhardyha.bugbuddy.model.enums.QuestionStatus;
import me.iamhardyha.bugbuddy.model.enums.ReactionType;
import me.iamhardyha.bugbuddy.model.enums.SnapshotRole;
import me.iamhardyha.bugbuddy.repository.AnswerReactionRepository;
import me.iamhardyha.bugbuddy.repository.AnswerRepository;
import me.iamhardyha.bugbuddy.repository.QuestionRepository;
import me.iamhardyha.bugbuddy.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AnswerService {

    private final AnswerRepository answerRepository;
    private final AnswerReactionRepository answerReactionRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;

    public AnswerService(
            AnswerRepository answerRepository,
            AnswerReactionRepository answerReactionRepository,
            QuestionRepository questionRepository,
            UserRepository userRepository
    ) {
        this.answerRepository = answerRepository;
        this.answerReactionRepository = answerReactionRepository;
        this.questionRepository = questionRepository;
        this.userRepository = userRepository;
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
        return AnswerResponse.of(saved, 0L);
    }

    public Page<AnswerResponse> findAllByQuestion(Long questionId, Pageable pageable) {
        questionRepository.findActiveById(questionId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.QUESTION_NOT_FOUND));

        return answerRepository.findAllActiveByQuestionId(questionId, pageable)
                .map(a -> {
                    long helpfulCount = answerReactionRepository
                            .countActiveByAnswerIdAndReactionType(a.getId(), ReactionType.HELPFUL);
                    return AnswerResponse.of(a, helpfulCount);
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

        long helpfulCount = answerReactionRepository
                .countActiveByAnswerIdAndReactionType(answerId, ReactionType.HELPFUL);
        return AnswerResponse.of(answer, helpfulCount);
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
        return AnswerResponse.of(answer, helpfulCount);
    }

    @Transactional
    public AnswerResponse addReaction(Long userId, Long questionId, Long answerId) {
        questionRepository.findActiveById(questionId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.QUESTION_NOT_FOUND));

        Answer answer = findActiveAnswerInQuestion(answerId, questionId);

        if (answer.getAuthorUserId().equals(userId)) {
            throw new BugBuddyException(ErrorCode.ANSWER_SELF_REACTION);
        }

        boolean alreadyReacted = answerReactionRepository
                .findActiveByAnswerIdAndVoterUserIdAndReactionType(answerId, userId, ReactionType.HELPFUL)
                .isPresent();

        if (alreadyReacted) {
            throw new BugBuddyException(ErrorCode.ANSWER_REACTION_ALREADY_EXISTS);
        }

        AnswerReaction reaction = new AnswerReaction();
        reaction.setAnswerId(answerId);
        reaction.setVoterUserId(userId);
        reaction.setReactionType(ReactionType.HELPFUL);
        answerReactionRepository.save(reaction);

        long helpfulCount = answerReactionRepository
                .countActiveByAnswerIdAndReactionType(answerId, ReactionType.HELPFUL);
        return AnswerResponse.of(answer, helpfulCount);
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
        return AnswerResponse.of(answer, helpfulCount);
    }

    private Answer findActiveAnswerInQuestion(Long answerId, Long questionId) {
        Answer answer = answerRepository.findActiveById(answerId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.ANSWER_NOT_FOUND));

        if (!answer.getQuestionId().equals(questionId)) {
            throw new BugBuddyException(ErrorCode.ANSWER_NOT_FOUND);
        }

        return answer;
    }
}
