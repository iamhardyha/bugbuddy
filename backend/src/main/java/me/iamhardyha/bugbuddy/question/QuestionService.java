package me.iamhardyha.bugbuddy.question;

import me.iamhardyha.bugbuddy.global.exception.BugBuddyException;
import me.iamhardyha.bugbuddy.global.response.ErrorCode;
import me.iamhardyha.bugbuddy.model.entity.Question;
import me.iamhardyha.bugbuddy.model.entity.UserEntity;
import me.iamhardyha.bugbuddy.model.enums.QuestionCategory;
import me.iamhardyha.bugbuddy.model.enums.QuestionStatus;
import me.iamhardyha.bugbuddy.model.enums.QuestionType;
import me.iamhardyha.bugbuddy.model.enums.ReferenceType;
import me.iamhardyha.bugbuddy.model.enums.XpEventType;
import me.iamhardyha.bugbuddy.question.dto.QuestionCreateRequest;
import me.iamhardyha.bugbuddy.question.dto.QuestionDetailResponse;
import me.iamhardyha.bugbuddy.question.dto.QuestionSummaryResponse;
import me.iamhardyha.bugbuddy.question.dto.QuestionUpdateRequest;
import me.iamhardyha.bugbuddy.repository.QuestionRepository;
import me.iamhardyha.bugbuddy.repository.UserRepository;
import me.iamhardyha.bugbuddy.upload.UploadService;
import me.iamhardyha.bugbuddy.xp.XpService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final UploadService uploadService;
    private final TagService tagService;
    private final XpService xpService;

    public QuestionService(QuestionRepository questionRepository,
                           UserRepository userRepository,
                           UploadService uploadService,
                           TagService tagService,
                           XpService xpService) {
        this.questionRepository = questionRepository;
        this.userRepository = userRepository;
        this.uploadService = uploadService;
        this.tagService = tagService;
        this.xpService = xpService;
    }

    @Transactional
    public QuestionDetailResponse create(Long userId, QuestionCreateRequest request) {
        UserEntity author = userRepository.findById(userId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.USER_NOT_FOUND));

        Question question = new Question();
        question.setAuthor(author);
        question.setTitle(request.title());
        question.setBody(request.body());
        question.setCategory(request.category());
        question.setQuestionType(request.questionType());
        question.setStatus(QuestionStatus.OPEN);

        Question saved = questionRepository.save(question);

        List<String> tagNames = tagService.attachTags(saved.getId(), request.tags());
        uploadService.linkUploads(request.uploadIds(), userId, ReferenceType.QUESTION, saved.getId());
        xpService.grantXp(userId, XpEventType.QUESTION_CREATED, ReferenceType.QUESTION, saved.getId(), 5);

        return QuestionDetailResponse.of(saved, tagNames);
    }

    public Page<QuestionSummaryResponse> findAll(QuestionCategory category,
                                                  QuestionType questionType,
                                                  QuestionStatus status,
                                                  Pageable pageable) {
        Page<Question> questions;

        if (category != null && questionType != null) {
            questions = questionRepository.findAllActiveByCategoryAndType(category, questionType, pageable);
        } else if (category != null) {
            questions = questionRepository.findAllActiveByCategory(category, pageable);
        } else if (questionType != null) {
            questions = questionRepository.findAllActiveByType(questionType, pageable);
        } else if (status != null) {
            questions = questionRepository.findAllActiveByStatus(status, pageable);
        } else {
            questions = questionRepository.findAllActive(pageable);
        }

        List<Long> questionIds = questions.getContent().stream()
                .map(Question::getId)
                .toList();

        Map<Long, List<String>> tagsMap = tagService.getTagNamesByQuestionIds(questionIds);

        return questions.map(q -> {
            List<String> tags = tagsMap.getOrDefault(q.getId(), List.of());
            return QuestionSummaryResponse.of(q, tags);
        });
    }

    @Transactional
    public QuestionDetailResponse findById(Long questionId) {
        Question question = questionRepository.findActiveById(questionId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.QUESTION_NOT_FOUND));

        questionRepository.incrementViewCount(questionId);
        question.setViewCount(question.getViewCount() + 1);

        List<String> tags = tagService.getTagNames(questionId);
        return QuestionDetailResponse.of(question, tags);
    }

    @Transactional
    public QuestionDetailResponse update(Long userId, Long questionId, QuestionUpdateRequest request) {
        Question question = questionRepository.findActiveById(questionId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.QUESTION_NOT_FOUND));

        if (!question.getAuthor().getId().equals(userId)) {
            throw new BugBuddyException(ErrorCode.QUESTION_FORBIDDEN);
        }

        if (question.getStatus() == QuestionStatus.CLOSED) {
            throw new BugBuddyException(ErrorCode.QUESTION_ALREADY_CLOSED);
        }

        question.setTitle(request.title());
        question.setBody(request.body());
        question.setCategory(request.category());
        question.setQuestionType(request.questionType());

        List<String> tagNames = tagService.attachTags(questionId, request.tags());
        uploadService.linkUploads(request.uploadIds(), userId, ReferenceType.QUESTION, questionId);

        return QuestionDetailResponse.of(question, tagNames);
    }

    @Transactional
    public void delete(Long userId, Long questionId) {
        Question question = questionRepository.findActiveById(questionId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.QUESTION_NOT_FOUND));

        if (!question.getAuthor().getId().equals(userId)) {
            throw new BugBuddyException(ErrorCode.QUESTION_FORBIDDEN);
        }

        question.softDelete();
    }

    @Transactional
    public QuestionDetailResponse close(Long userId, Long questionId) {
        Question question = questionRepository.findActiveById(questionId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.QUESTION_NOT_FOUND));

        if (!question.getAuthor().getId().equals(userId)) {
            throw new BugBuddyException(ErrorCode.QUESTION_FORBIDDEN);
        }

        if (question.getStatus() == QuestionStatus.CLOSED) {
            throw new BugBuddyException(ErrorCode.QUESTION_ALREADY_CLOSED);
        }

        question.setStatus(QuestionStatus.CLOSED);

        List<String> tags = tagService.getTagNames(questionId);
        return QuestionDetailResponse.of(question, tags);
    }
}
