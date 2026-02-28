package me.iamhardyha.bugbuddy.user;

import me.iamhardyha.bugbuddy.global.exception.BugBuddyException;
import me.iamhardyha.bugbuddy.global.response.ErrorCode;
import me.iamhardyha.bugbuddy.model.entity.Answer;
import me.iamhardyha.bugbuddy.model.entity.Question;
import me.iamhardyha.bugbuddy.model.entity.UserEntity;
import me.iamhardyha.bugbuddy.model.enums.ReactionType;
import me.iamhardyha.bugbuddy.question.dto.QuestionSummaryResponse;
import me.iamhardyha.bugbuddy.model.entity.Tag;
import me.iamhardyha.bugbuddy.model.entity.QuestionTag;
import me.iamhardyha.bugbuddy.repository.*;
import me.iamhardyha.bugbuddy.user.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final QuestionTagRepository questionTagRepository;
    private final TagRepository tagRepository;
    private final AnswerRepository answerRepository;
    private final AnswerReactionRepository answerReactionRepository;

    public UserService(UserRepository userRepository,
                       QuestionRepository questionRepository,
                       QuestionTagRepository questionTagRepository,
                       TagRepository tagRepository,
                       AnswerRepository answerRepository,
                       AnswerReactionRepository answerReactionRepository) {
        this.userRepository = userRepository;
        this.questionRepository = questionRepository;
        this.questionTagRepository = questionTagRepository;
        this.tagRepository = tagRepository;
        this.answerRepository = answerRepository;
        this.answerReactionRepository = answerReactionRepository;
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
        String newNickname = request.getNickname();

        if (!newNickname.equals(user.getNickname()) && userRepository.existsByNickname(newNickname)) {
            throw new BugBuddyException(ErrorCode.DUPLICATE_NICKNAME);
        }

        user.setNickname(newNickname);
        user.setBio(request.getBio());
    }

    @Transactional
    public void deactivate(Long userId) {
        UserEntity user = findActiveUser(userId);
        user.setDeactivatedAt(Instant.now());
    }

    public Page<QuestionSummaryResponse> getUserQuestions(Long userId, Pageable pageable) {
        findActiveUser(userId);
        Page<Question> questions = questionRepository.findAllActiveByAuthorUserId(userId, pageable);
        return questions.map(q -> {
            List<QuestionTag> questionTags = questionTagRepository.findByQuestionId(q.getId());
            List<String> tags = questionTags.isEmpty() ? List.of()
                    : tagRepository.findAllById(questionTags.stream().map(QuestionTag::getTagId).toList())
                            .stream().map(Tag::getName).toList();
            String nickname = userRepository.findById(q.getAuthorUserId())
                    .map(UserEntity::getNickname).orElse("탈퇴한 유저");
            return QuestionSummaryResponse.of(q, tags, nickname);
        });
    }

    public Page<UserAnswerSummaryResponse> getUserAnswers(Long userId, Pageable pageable) {
        findActiveUser(userId);
        Page<Answer> answers = answerRepository.findAllActiveByAuthorUserId(userId, pageable);
        return answers.map(a -> {
            long helpfulCount = answerReactionRepository.countActiveByAnswerIdAndReactionType(a.getId(), ReactionType.HELPFUL);
            return UserAnswerSummaryResponse.of(a, helpfulCount);
        });
    }

    public UserStatsResponse getUserStats(Long userId) {
        findActiveUser(userId);
        long questionCount = questionRepository.countAllActiveByAuthorUserId(userId);
        long answerCount = answerRepository.countAllActiveByAuthorUserId(userId);
        long helpfulReceivedCount = answerReactionRepository.countHelpfulReceivedByAuthorUserId(userId, ReactionType.HELPFUL);
        long acceptedAnswerCount = answerRepository.countAllAcceptedByAuthorUserId(userId);
        return new UserStatsResponse(questionCount, answerCount, helpfulReceivedCount, acceptedAnswerCount);
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
