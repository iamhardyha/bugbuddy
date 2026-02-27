package me.iamhardyha.bugbuddy.model.entity;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode
public class QuestionTagId implements Serializable {

    private Long questionId;
    private Long tagId;
}
