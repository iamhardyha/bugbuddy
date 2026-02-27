package me.iamhardyha.bugbuddy.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(
        name = "question_tags",
        indexes = {
                @Index(name = "idx_question_tags_tag", columnList = "tag_id, question_id")
        }
)
@IdClass(QuestionTagId.class)
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
public class QuestionTag {

    @Id
    @Column(name = "question_id")
    private Long questionId;

    @Id
    @Column(name = "tag_id")
    private Long tagId;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
