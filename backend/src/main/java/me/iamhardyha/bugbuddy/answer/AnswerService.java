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
import me.iamhardyha.bugbuddy.model.enums.ReferenceType;
import me.iamhardyha.bugbuddy.model.enums.SnapshotRole;
import me.iamhardyha.bugbuddy.model.enums.XpEventType;
import me.iamhardyha.bugbuddy.repository.AnswerReactionRepository;
import me.iamhardyha.bugbuddy.repository.AnswerRepository;
import me.iamhardyha.bugbuddy.repository.QuestionRepository;
import me.iamhardyha.bugbuddy.repository.UserRepository;
import me.iamhardyha.bugbuddy.notification.event.AnswerAcceptedEvent;
import me.iamhardyha.bugbuddy.notification.event.AnswerCreatedEvent;
import me.iamhardyha.bugbuddy.notification.event.AnswerHelpfulEvent;
import me.iamhardyha.bugbuddy.upload.UploadService;
import me.iamhardyha.bugbuddy.xp.XpService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AnswerService {

    private final AnswerRepository answerRepository;
    private final AnswerReactionRepository answerReactionRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final UploadService uploadService;
    private final XpService xpService;
    private final ApplicationEventPublisher eventPublisher;

    public AnswerService(
            AnswerRepository answerRepository,
            AnswerReactionRepository answerReactionRepository,
            QuestionRepository questionRepository,
            UserRepository userRepository,
            UploadService uploadService,
            XpService xpService,
            ApplicationEventPublisher eventPublisher
    ) {
        this.answerRepository = answerRepository;
        this.answerReactionRepository = answerReactionRepository;
        this.questionRepository = questionRepository;
        this.userRepository = userRepository;
        this.uploadService = uploadService;
        this.xpService = xpService;
        this.eventPublisher = eventPublisher;
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
        answer.setQuestion(question);
        answer.setAuthor(user);
        answer.setBody(request.body());
        answer.setAuthorSnapshotRole(snapshotRole);
        answer.setAllowOneToOne(request.allowOneToOne() && snapshotRole == SnapshotRole.MENTOR);

        Answer saved = answerRepository.save(answer);
        uploadService.linkUploads(request.uploadIds(), userId, ReferenceType.ANSWER, saved.getId());
        xpService.grantXp(userId, XpEventType.ANSWER_CREATED, ReferenceType.ANSWER, saved.getId(), 5);
        eventPublisher.publishEvent(new AnswerCreatedEvent(userId, question.getAuthor().getId(), questionId));
        return AnswerResponse.of(saved, 0L, false);
    }

    public Page<AnswerResponse> findAllByQuestion(Long questionId, Long currentUserId, Pageable pageable) {
        questionRepository.findActiveById(questionId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.QUESTION_NOT_FOUND));

        // 1 query: answers page with author JOIN FETCH
        Page<Answer> answers = answerRepository.findAllActiveByQuestionId(questionId, pageable);

        if (answers.isEmpty()) {
            return answers.map(a -> AnswerResponse.of(a, 0L, false));
        }

        // Extract answer IDs
        List<Long> answerIds = answers.stream().map(Answer::getId).toList();

        // 1 query: batch count helpful reactions
        Map<Long, Long> helpfulCountMap = answerReactionRepository
                .countByAnswerIdsAndReactionType(answerIds, ReactionType.HELPFUL)
                .stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Long) row[1]
                ));

        // 1 query: reacted answer IDs for current user
        Set<Long> reactedIds = currentUserId != null
                ? answerReactionRepository.findReactedAnswerIds(currentUserId, ReactionType.HELPFUL, answerIds)
                : Collections.emptySet();

        return answers.map(a -> {
            long helpfulCount = helpfulCountMap.getOrDefault(a.getId(), 0L);
            boolean myHelpful = reactedIds.contains(a.getId());
            return AnswerResponse.of(a, helpfulCount, myHelpful);
        });
    }

    @Transactional
    public AnswerResponse update(Long userId, Long questionId, Long answerId, AnswerUpdateRequest request) {
        questionRepository.findActiveById(questionId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.QUESTION_NOT_FOUND));

        Answer answer = findActiveAnswerInQuestion(answerId, questionId);

        if (!answer.getAuthor().getId().equals(userId)) {
            throw new BugBuddyException(ErrorCode.ANSWER_FORBIDDEN);
        }

        answer.setBody(request.body());

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.USER_NOT_FOUND));
        boolean isMentor = user.getMentorStatus() == MentorStatus.APPROVED;
        answer.setAllowOneToOne(request.allowOneToOne() && isMentor);

        uploadService.linkUploads(request.uploadIds(), userId, ReferenceType.ANSWER, answerId);

        long helpfulCount = answerReactionRepository
                .countActiveByAnswerIdAndReactionType(answerId, ReactionType.HELPFUL);
        boolean myHelpful = answerReactionRepository
                .findActiveByAnswerIdAndVoterUserIdAndReactionType(answerId, userId, ReactionType.HELPFUL)
                .isPresent();
        return AnswerResponse.of(answer, helpfulCount, myHelpful);
    }

    @Transactional
    public void delete(Long userId, Long questionId, Long answerId) {
        questionRepository.findActiveById(questionId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.QUESTION_NOT_FOUND));

        Answer answer = findActiveAnswerInQuestion(answerId, questionId);

        if (!answer.getAuthor().getId().equals(userId)) {
            throw new BugBuddyException(ErrorCode.ANSWER_FORBIDDEN);
        }

        answer.softDelete();
    }

    @Transactional
    public AnswerResponse accept(Long userId, Long questionId, Long answerId) {
        Question question = questionRepository.findActiveById(questionId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.QUESTION_NOT_FOUND));

        if (!question.getAuthor().getId().equals(userId)) {
            throw new BugBuddyException(ErrorCode.ANSWER_ACCEPT_FORBIDDEN);
        }

        if (question.getStatus() == QuestionStatus.SOLVED) {
            throw new BugBuddyException(ErrorCode.QUESTION_ALREADY_SOLVED);
        }

        Answer answer = findActiveAnswerInQuestion(answerId, questionId);

        answer.setAccepted(true);
        question.setStatus(QuestionStatus.SOLVED);
        xpService.grantXp(answer.getAuthor().getId(), XpEventType.ANSWER_ACCEPTED,
                ReferenceType.ANSWER, answerId, 30);
        eventPublisher.publishEvent(new AnswerAcceptedEvent(userId, answer.getAuthor().getId(), answerId));

        long helpfulCount = answerReactionRepository
                .countActiveByAnswerIdAndReactionType(answerId, ReactionType.HELPFUL);
        return AnswerResponse.of(answer, helpfulCount, false);
    }

    @Transactional
    public AnswerResponse addReaction(Long userId, Long questionId, Long answerId) {
        questionRepository.findActiveById(questionId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.QUESTION_NOT_FOUND));

        Answer answer = findActiveAnswerInQuestion(answerId, questionId);

        if (answer.getAuthor().getId().equals(userId)) {
            throw new BugBuddyException(ErrorCode.ANSWER_SELF_REACTION);
        }

        AnswerReaction reaction = answerReactionRepository
                .findByAnswerIdAndVoterUserIdAndReactionType(answerId, userId, ReactionType.HELPFUL)
                .orElse(null);

        if (reaction != null && !reaction.isDeleted()) {
            throw new BugBuddyException(ErrorCode.ANSWER_REACTION_ALREADY_EXISTS);
        }

        if (reaction != null) {
            reaction.setDeletedAt(null);
        } else {
            reaction = new AnswerReaction();
            reaction.setAnswerId(answerId);
            reaction.setVoterUserId(userId);
            reaction.setReactionType(ReactionType.HELPFUL);
            answerReactionRepository.save(reaction);
        }

        xpService.grantXp(answer.getAuthor().getId(), XpEventType.ANSWER_HELPFUL_RECEIVED,
                ReferenceType.ANSWER, answerId, 20);
        eventPublisher.publishEvent(new AnswerHelpfulEvent(userId, answer.getAuthor().getId(), answerId));

        long helpfulCount = answerReactionRepository
                .countActiveByAnswerIdAndReactionType(answerId, ReactionType.HELPFUL);
        return AnswerResponse.of(answer, helpfulCount, true);
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
        return AnswerResponse.of(answer, helpfulCount, false);
    }

    private Answer findActiveAnswerInQuestion(Long answerId, Long questionId) {
        Answer answer = answerRepository.findActiveById(answerId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.ANSWER_NOT_FOUND));

        if (!answer.getQuestion().getId().equals(questionId)) {
            throw new BugBuddyException(ErrorCode.ANSWER_NOT_FOUND);
        }

        return answer;
    }
}
