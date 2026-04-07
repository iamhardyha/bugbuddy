package me.iamhardyha.bugbuddy.mentor;

import me.iamhardyha.bugbuddy.model.entity.MentorApplicationLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MentorApplicationLinkRepository extends JpaRepository<MentorApplicationLink, Long> {

    List<MentorApplicationLink> findAllByMentorApplicationId(Long mentorApplicationId);

    List<MentorApplicationLink> findAllByMentorApplicationIdIn(java.util.Collection<Long> mentorApplicationIds);
}
