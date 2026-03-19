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
}
