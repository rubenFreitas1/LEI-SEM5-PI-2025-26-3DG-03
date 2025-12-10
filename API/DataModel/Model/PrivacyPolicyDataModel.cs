namespace DataModel.Model;

using Domain.Model;

public class PrivacyPolicyDataModel
{
    public long Id { get; set; }
    public string? Content { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsCurrent { get; set; }

    public PrivacyPolicyDataModel() { }

    public PrivacyPolicyDataModel(PrivacyPolicy privacyPolicy)
    {
        Id = privacyPolicy.Id;
        Content = privacyPolicy.Content;
        CreatedAt = privacyPolicy.CreatedAt;
        IsCurrent = privacyPolicy.IsCurrent;
    }
}
