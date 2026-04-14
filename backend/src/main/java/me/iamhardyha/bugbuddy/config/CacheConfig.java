package me.iamhardyha.bugbuddy.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class CacheConfig {

    public static final String CACHE_RANKING_CURRENT = "rankingCurrent";
    public static final String CACHE_RANKING_PREVIOUS = "rankingPrevious";

    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager manager = new SimpleCacheManager();
        manager.setCaches(List.of(
                buildCache(CACHE_RANKING_CURRENT, 5, TimeUnit.MINUTES, 64),
                buildCache(CACHE_RANKING_PREVIOUS, 60, TimeUnit.MINUTES, 64)
        ));
        return manager;
    }

    private CaffeineCache buildCache(String name, long ttl, TimeUnit unit, long maxSize) {
        return new CaffeineCache(name,
                Caffeine.newBuilder()
                        .expireAfterWrite(ttl, unit)
                        .maximumSize(maxSize)
                        .build());
    }
}
