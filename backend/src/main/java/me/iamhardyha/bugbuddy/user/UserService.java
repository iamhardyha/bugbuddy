package me.iamhardyha.bugbuddy.user;

import me.iamhardyha.bugbuddy.global.exception.BugBuddyException;
import me.iamhardyha.bugbuddy.global.response.ErrorCode;
import me.iamhardyha.bugbuddy.model.entity.Answer;
import me.iamhardyha.bugbuddy.model.entity.Question;
import me.iamhardyha.bugbuddy.model.entity.UserEntity;
import me.iamhardyha.bugbuddy.model.enums.ReactionType;
import me.iamhardyha.bugbuddy.question.TagService;
import me.iamhardyha.bugbuddy.question.dto.QuestionSummaryResponse;
import me.iamhardyha.bugbuddy.repository.AnswerReactionRepository;
import me.iamhardyha.bugbuddy.repository.AnswerRepository;
import me.iamhardyha.bugbuddy.repository.QuestionRepository;
import me.iamhardyha.bugbuddy.repository.UserRepository;
import me.iamhardyha.bugbuddy.user.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final AnswerReactionRepository answerReactionRepository;
    private final TagService tagService;

    public UserService(UserRepository userRepository,
                       QuestionRepository questionRepository,
                       AnswerRepository answerRepository,
                       AnswerReactionRepository answerReactionRepository,
                       TagService tagService) {
        this.userRepository = userRepository;
        this.questionRepository = questionRepository;
        this.answerRepository = answerRepository;
        this.answerReactionRepository = answerReactionRepository;
        this.tagService = tagService;
    }

    public UserEntity findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.USER_NOT_FOUND));
    }

    public PublicProfileResponse getPublicProfile(Long userId) {
        UserEntity user = findActiveUser(userId);
        long questionCount = questionRepository.countAllActiveByAuthorUserId(userId);
        long answerCount = answerRepository.countAllActiveByAuthorUserId(userId);
        return PublicProfileResponse.of(user, questionCount, answerCount);
    }

    @Transactional
    public void updateProfile(Long userId, ProfileUpdateRequest request) {
        UserEntity user = findActiveUser(userId);
        String newNickname = request.nickname();

        if (!newNickname.equals(user.getNickname()) && userRepository.existsByNickname(newNickname)) {
            throw new BugBuddyException(ErrorCode.DUPLICATE_NICKNAME);
        }

        user.setNickname(newNickname);
        user.setBio(request.bio());
    }

    @Transactional
    public void deactivate(Long userId) {
        UserEntity user = findActiveUser(userId);
        user.setDeactivatedAt(Instant.now());
    }

    /**
     * Batch tag loading pattern (Phase 1):
     * 1 query for questions page (JOIN FETCH author),
     * 1 query for all tags of those questions.
     */
    public Page<QuestionSummaryResponse> getUserQuestions(Long userId, Pageable pageable) {
        findActiveUser(userId);
        Page<Question> questions = questionRepository.findAllActiveByAuthorUserId(userId, pageable);

        List<Long> questionIds = questions.getContent().stream()
                .map(Question::getId)
                .toList();

        Map<Long, List<String>> tagsMap = tagService.getTagNamesByQuestionIds(questionIds);

        return questions.map(q -> {
            List<String> tags = tagsMap.getOrDefault(q.getId(), List.of());
            return QuestionSummaryResponse.of(q, tags);
        });
    }

    /**
     * Batch helpful-count loading pattern (Phase 2):
     * 1 query for answers page (JOIN FETCH author),
     * 1 query for helpful counts of those answers.
     */
    public Page<UserAnswerSummaryResponse> getUserAnswers(Long userId, Pageable pageable) {
        findActiveUser(userId);
        Page<Answer> answers = answerRepository.findAllActiveByAuthorUserId(userId, pageable);

        if (answers.isEmpty()) {
            return answers.map(a -> UserAnswerSummaryResponse.of(a, 0L));
        }

        List<Long> answerIds = answers.getContent().stream()
                .map(Answer::getId)
                .toList();

        Map<Long, Long> helpfulCountMap = answerReactionRepository
                .countByAnswerIdsAndReactionType(answerIds, ReactionType.HELPFUL)
                .stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Long) row[1]
                ));

        return answers.map(a -> {
            long helpfulCount = helpfulCountMap.getOrDefault(a.getId(), 0L);
            return UserAnswerSummaryResponse.of(a, helpfulCount);
        });
    }

    public UserStatsResponse getUserStats(Long userId) {
        findActiveUser(userId);
        long questionCount = questionRepository.countAllActiveByAuthorUserId(userId);
        long answerCount = answerRepository.countAllActiveByAuthorUserId(userId);
        long helpfulReceivedCount = answerReactionRepository.countHelpfulReceivedByAuthorUserId(userId, ReactionType.HELPFUL);
        long acceptedAnswerCount = answerRepository.countAllAcceptedByAuthorUserId(userId);
        return UserStatsResponse.of(questionCount, answerCount, helpfulReceivedCount, acceptedAnswerCount);
    }

    private UserEntity findActiveUser(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.USER_NOT_FOUND));
        if (user.getDeactivatedAt() != null) {
            throw new BugBuddyException(ErrorCode.USER_NOT_FOUND);
        }
        return user;
    }
}
