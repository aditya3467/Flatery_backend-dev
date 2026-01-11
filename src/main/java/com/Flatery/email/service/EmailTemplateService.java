package com.Flatery.email.service;

import com.Flatery.email.EmailType;
import com.Flatery.email.entity.EmailTemplate;
import com.Flatery.email.repository.EmailTemplateRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class EmailTemplateService {

    private final EmailTemplateRepository templateRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final Pattern PLACEHOLDER_PATTERN = Pattern.compile("\\{\\{([a-zA-Z0-9_]+)\\}}", Pattern.MULTILINE);

    public Optional<EmailTemplate> getActiveTemplate(EmailType type) {
        return templateRepository.findFirstByTemplateKeyAndActiveTrue(type);
    }

    public Set<String> extractPlaceholders(String content) {
        Set<String> keys = new LinkedHashSet<>();
        if (content == null) return keys;
        Matcher m = PLACEHOLDER_PATTERN.matcher(content);
        while (m.find()) {
            keys.add(m.group(1));
        }
        return keys;
    }

    public Set<String> getExpectedPlaceholders(EmailTemplate template) {
        try {
            if (template.getPlaceholdersJson() == null || template.getPlaceholdersJson().isBlank()) {
                // Derive from template bodies if not stored
                Set<String> keys = new LinkedHashSet<>();
                keys.addAll(extractPlaceholders(template.getSubject()));
                keys.addAll(extractPlaceholders(template.getHtmlBody()));
                keys.addAll(extractPlaceholders(template.getTextBody()));
                return keys;
            }
            return objectMapper.readValue(template.getPlaceholdersJson(), new TypeReference<Set<String>>(){});
        } catch (Exception e) {
            throw new RuntimeException("Invalid placeholders JSON", e);
        }
    }

    public void validateAllPlaceholdersPresent(Map<String, Object> data, Set<String> expected) {
        List<String> missing = new ArrayList<>();
        for (String key : expected) {
            if (!data.containsKey(key) || data.get(key) == null) {
                missing.add(key);
            }
        }
        if (!missing.isEmpty()) {
            throw new IllegalArgumentException("Missing template variables: " + String.join(", ", missing));
        }
    }

    public String render(String content, Map<String, Object> data) {
        if (content == null) return null;
        String result = content;
        Matcher m = PLACEHOLDER_PATTERN.matcher(content);
        StringBuffer sb = new StringBuffer();
        while (m.find()) {
            String key = m.group(1);
            Object val = data.get(key);
            String replacement = val == null ? "" : Matcher.quoteReplacement(String.valueOf(val));
            m.appendReplacement(sb, replacement);
        }
        m.appendTail(sb);
        result = sb.toString();
        return result;
    }
}
