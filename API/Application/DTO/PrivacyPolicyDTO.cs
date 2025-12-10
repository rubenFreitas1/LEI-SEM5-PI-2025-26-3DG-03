namespace Application.DTO;

using Domain.Model;
using System.Text.Json.Serialization;

public class PrivacyPolicyDTO
{
    public long Id { get; set; }

    public string? Content { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public PrivacyPolicyDTO() { }

    public PrivacyPolicyDTO(long id, string? content, DateTime createdAt)
    {
        Id = id;
        Content = content;
        CreatedAt = createdAt;
    }

    static public PrivacyPolicyDTO ToDTO(PrivacyPolicy privacyPolicy)
    {
        return new PrivacyPolicyDTO(privacyPolicy.Id, privacyPolicy.Content, privacyPolicy.CreatedAt);
    }

    static public IEnumerable<PrivacyPolicyDTO> ToDTO(IEnumerable<PrivacyPolicy> privacyPolicies)
    {
        List<PrivacyPolicyDTO> privacyPolicyDTOs = new List<PrivacyPolicyDTO>();
        foreach (PrivacyPolicy privacyPolicy in privacyPolicies)
        {
            PrivacyPolicyDTO privacyPolicyDTO = ToDTO(privacyPolicy);
            privacyPolicyDTOs.Add(privacyPolicyDTO);
        }
        return privacyPolicyDTOs;
    }
}