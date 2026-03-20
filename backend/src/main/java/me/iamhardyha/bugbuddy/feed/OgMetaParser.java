package me.iamhardyha.bugbuddy.feed;

import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.URL;

@Slf4j
@Component
public class OgMetaParser {

    public record OgMeta(String title, String description, String ogImageUrl, String domain) {}

    public OgMeta parse(String urlString) {
        String domain = extractDomain(urlString);
        try {
            validateUrl(urlString);
            Document doc = Jsoup.connect(urlString)
                    .timeout(3000)
                    .maxBodySize(1_000_000)
                    .followRedirects(false)
                    .userAgent("BugBuddy/1.0")
                    .get();

            String title = getMetaContent(doc, "og:title");
            if (title == null) title = doc.title();
            String description = getMetaContent(doc, "og:description");
            String ogImage = getMetaContent(doc, "og:image");

            return new OgMeta(title, description, ogImage, domain);
        } catch (Exception e) {
            log.warn("OG 메타 파싱 실패: url={}, error={}", urlString, e.getMessage());
            return new OgMeta(null, null, null, domain);
        }
    }

    private void validateUrl(String urlString) {
        try {
            URL url = new URL(urlString);
            String protocol = url.getProtocol();
            if (!"http".equals(protocol) && !"https".equals(protocol)) {
                throw new IllegalArgumentException("허용되지 않는 프로토콜: " + protocol);
            }

            InetAddress address = InetAddress.getByName(url.getHost());
            if (address.isSiteLocalAddress() || address.isLoopbackAddress()
                    || address.isLinkLocalAddress() || address.isAnyLocalAddress()) {
                throw new IllegalArgumentException("내부 네트워크 접근 불가: " + url.getHost());
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("잘못된 URL: " + urlString);
        }
    }

    private String extractDomain(String urlString) {
        try {
            return new URL(urlString).getHost();
        } catch (Exception e) {
            return null;
        }
    }

    private String getMetaContent(Document doc, String property) {
        var element = doc.selectFirst("meta[property=" + property + "]");
        if (element != null) return element.attr("content");
        // Fallback to name attribute (some sites use name instead of property)
        element = doc.selectFirst("meta[name=" + property + "]");
        return element != null ? element.attr("content") : null;
    }
}
