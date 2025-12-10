namespace Domain.Model;

using System.ComponentModel.DataAnnotations;

public class PrivacyPolicy
{
    public long Id { get; set; }

    public string? Content { get; private set;}

    public DateTime CreatedAt { get; private set;}

    public bool IsCurrent { get; private set;}

    private PrivacyPolicy() { }

    public PrivacyPolicy(string content)
    {
        ValidateContent(content);
        Content = content.Trim();
        CreatedAt = DateTime.UtcNow;
        IsCurrent = true;
    }

    public void ValidateContent(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            throw new ArgumentException("Content cannot be null or empty.", nameof(content));
        }
        content = content.Trim();
        if (content.Length < 10)
        {
            throw new ArgumentException("Content must be at least 10 characters long.", nameof(content));
        }
    }
}