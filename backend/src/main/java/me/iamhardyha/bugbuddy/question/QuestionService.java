package me.iamhardyha.bugbuddy.question;

import me.iamhardyha.bugbuddy.global.exception.BugBuddyException;
import me.iamhardyha.bugbuddy.global.response.ErrorCode;
import me.iamhardyha.bugbuddy.model.entity.Question;
import me.iamhardyha.bugbuddy.model.entity.QuestionTag;
import me.iamhardyha.bugbuddy.model.entity.Tag;
import me.iamhardyha.bugbuddy.model.enums.QuestionCategory;
import me.iamhardyha.bugbuddy.model.enums.QuestionStatus;
import me.iamhardyha.bugbuddy.model.enums.QuestionType;
import me.iamhardyha.bugbuddy.question.dto.QuestionCreateRequest;
import me.iamhardyha.bugbuddy.question.dto.QuestionDetailResponse;
import me.iamhardyha.bugbuddy.question.dto.QuestionSummaryResponse;
import me.iamhardyha.bugbuddy.question.dto.QuestionUpdateRequest;
import me.iamhardyha.bugbuddy.model.entity.UserEntity;
import me.iamhardyha.bugbuddy.model.enums.ReferenceType;
import me.iamhardyha.bugbuddy.repository.QuestionRepository;
import me.iamhardyha.bugbuddy.repository.QuestionTagRepository;
import me.iamhardyha.bugbuddy.repository.TagRepository;
import me.iamhardyha.bugbuddy.repository.UserRepository;
import me.iamhardyha.bugbuddy.model.enums.XpEventType;
import me.iamhardyha.bugbuddy.upload.UploadService;
import me.iamhardyha.bugbuddy.xp.XpService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final QuestionTagRepository questionTagRepository;
    private final TagRepository tagRepository;
    private final UploadService uploadService;
    private final UserRepository userRepository;
    private final XpService xpService;

    public QuestionService(QuestionRepository questionRepository,
                           QuestionTagRepository questionTagRepository,
                           TagRepository tagRepository,
                           UploadService uploadService,
                           UserRepository userRepository,
                           XpService xpService) {
        this.questionRepository = questionRepository;
        this.questionTagRepository = questionTagRepository;
        this.tagRepository = tagRepository;
        this.uploadService = uploadService;
        this.userRepository = userRepository;
        this.xpService = xpService;
    }

    @Transactional
    public QuestionDetailResponse create(Long userId, QuestionCreateRequest request) {
        Question question = new Question();
        question.setAuthorUserId(userId);
        question.setTitle(request.title());
        question.setBody(request.body());
        question.setCategory(request.category());
        question.setQuestionType(request.questionType());
        question.setStatus(QuestionStatus.OPEN);

        Question saved = questionRepository.save(question);

        List<String> tagNames = attachTags(saved.getId(), request.tags());
        uploadService.linkUploads(request.uploadIds(), userId, ReferenceType.QUESTION, saved.getId());
        xpService.grantXp(userId, XpEventType.QUESTION_CREATED, ReferenceType.QUESTION, saved.getId(), 5);

        return QuestionDetailResponse.of(saved, tagNames, getNickname(userId));
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

        return questions.map(q -> {
            List<String> tags = getTagNames(q.getId());
            return QuestionSummaryResponse.of(q, tags, getNickname(q.getAuthorUserId()));
        });
    }

    @Transactional
    public QuestionDetailResponse findById(Long questionId) {
        Question question = questionRepository.findActiveById(questionId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.QUESTION_NOT_FOUND));

        questionRepository.incrementViewCount(questionId);
        question.setViewCount(question.getViewCount() + 1);

        List<String> tags = getTagNames(questionId);
        return QuestionDetailResponse.of(question, tags, getNickname(question.getAuthorUserId()));
    }

    @Transactional
    public QuestionDetailResponse update(Long userId, Long questionId, QuestionUpdateRequest request) {
        Question question = questionRepository.findActiveById(questionId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.QUESTION_NOT_FOUND));

        if (!question.getAuthorUserId().equals(userId)) {
            throw new BugBuddyException(ErrorCode.QUESTION_FORBIDDEN);
        }

        if (question.getStatus() == QuestionStatus.CLOSED) {
            throw new BugBuddyException(ErrorCode.QUESTION_ALREADY_CLOSED);
        }

        question.setTitle(request.title());
        question.setBody(request.body());
        question.setCategory(request.category());
        question.setQuestionType(request.questionType());

        questionTagRepository.deleteByQuestionId(questionId);
        List<String> tagNames = attachTags(questionId, request.tags());
        uploadService.linkUploads(request.uploadIds(), userId, ReferenceType.QUESTION, questionId);

        return QuestionDetailResponse.of(question, tagNames, getNickname(userId));
    }

    @Transactional
    public void delete(Long userId, Long questionId) {
        Question question = questionRepository.findActiveById(questionId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.QUESTION_NOT_FOUND));

        if (!question.getAuthorUserId().equals(userId)) {
            throw new BugBuddyException(ErrorCode.QUESTION_FORBIDDEN);
        }

        question.softDelete();
    }

    @Transactional
    public QuestionDetailResponse close(Long userId, Long questionId) {
        Question question = questionRepository.findActiveById(questionId)
                .orElseThrow(() -> new BugBuddyException(ErrorCode.QUESTION_NOT_FOUND));

        if (!question.getAuthorUserId().equals(userId)) {
            throw new BugBuddyException(ErrorCode.QUESTION_FORBIDDEN);
        }

        if (question.getStatus() == QuestionStatus.CLOSED) {
            throw new BugBuddyException(ErrorCode.QUESTION_ALREADY_CLOSED);
        }

        question.setStatus(QuestionStatus.CLOSED);

        List<String> tags = getTagNames(questionId);
        return QuestionDetailResponse.of(question, tags, getNickname(question.getAuthorUserId()));
    }

    private List<String> attachTags(Long questionId, List<String> tagNames) {
        if (tagNames == null || tagNames.isEmpty()) {
            return List.of();
        }

        return tagNames.stream().map(name -> {
            Tag tag = tagRepository.findActiveByName(name)
                    .orElseGet(() -> {
                        Tag newTag = new Tag();
                        newTag.setName(name);
                        newTag.setOfficial(false);
                        return tagRepository.save(newTag);
                    });

            QuestionTag questionTag = new QuestionTag();
            questionTag.setQuestionId(questionId);
            questionTag.setTagId(tag.getId());
            questionTagRepository.save(questionTag);

            return tag.getName();
        }).toList();
    }

    private List<String> getTagNames(Long questionId) {
        List<QuestionTag> questionTags = questionTagRepository.findByQuestionId(questionId);
        if (questionTags.isEmpty()) {
            return List.of();
        }

        List<Long> tagIds = questionTags.stream().map(QuestionTag::getTagId).toList();
        return tagRepository.findAllById(tagIds).stream().map(Tag::getName).toList();
    }

    private String getNickname(Long userId) {
        return userRepository.findById(userId)
                .map(UserEntity::getNickname)
                .orElse("알 수 없음");
    }
}
