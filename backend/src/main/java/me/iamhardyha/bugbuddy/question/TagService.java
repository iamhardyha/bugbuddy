package me.iamhardyha.bugbuddy.question;

import me.iamhardyha.bugbuddy.model.entity.QuestionTag;
import me.iamhardyha.bugbuddy.model.entity.Tag;
import me.iamhardyha.bugbuddy.repository.QuestionTagRepository;
import me.iamhardyha.bugbuddy.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TagService {

    private final TagRepository tagRepository;
    private final QuestionTagRepository questionTagRepository;

    public List<String> getTagNames(Long questionId) {
        List<QuestionTag> questionTags = questionTagRepository.findByQuestionId(questionId);
        if (questionTags.isEmpty()) {
            return List.of();
        }

        List<Long> tagIds = questionTags.stream().map(QuestionTag::getTagId).toList();
        return tagRepository.findAllById(tagIds).stream().map(Tag::getName).toList();
    }

    public Map<Long, List<String>> getTagNamesByQuestionIds(Collection<Long> questionIds) {
        if (questionIds == null || questionIds.isEmpty()) {
            return Map.of();
        }

        List<Object[]> rows = tagRepository.findTagNamesByQuestionIds(questionIds);

        return rows.stream().collect(Collectors.groupingBy(
                row -> (Long) row[0],
                Collectors.mapping(row -> (String) row[1], Collectors.toList())
        ));
    }

    @Transactional
    public List<String> attachTags(Long questionId, List<String> tagNames) {
        questionTagRepository.deleteByQuestionId(questionId);

        if (tagNames == null || tagNames.isEmpty()) {
            return List.of();
        }

        // 1. 배치 조회: 기존 태그를 한 번에 가져오기
        List<Tag> existingTags = tagRepository.findAllActive();
        Map<String, Tag> existingTagMap = existingTags.stream()
                .collect(Collectors.toMap(Tag::getName, t -> t));

        // 2. 새 태그 생성 + 기존 태그 매핑
        List<Tag> newTags = new ArrayList<>();
        List<Tag> resolvedTags = new ArrayList<>();
        for (String name : tagNames) {
            Tag existing = existingTagMap.get(name);
            if (existing != null) {
                resolvedTags.add(existing);
            } else {
                Tag newTag = new Tag();
                newTag.setName(name);
                newTag.setOfficial(false);
                newTags.add(newTag);
            }
        }
        if (!newTags.isEmpty()) {
            resolvedTags.addAll(tagRepository.saveAll(newTags));
        }

        // 3. QuestionTag 배치 저장
        List<QuestionTag> questionTags = resolvedTags.stream().map(tag -> {
            QuestionTag qt = new QuestionTag();
            qt.setQuestionId(questionId);
            qt.setTagId(tag.getId());
            return qt;
        }).toList();
        questionTagRepository.saveAll(questionTags);

        return resolvedTags.stream().map(Tag::getName).toList();
    }
}
