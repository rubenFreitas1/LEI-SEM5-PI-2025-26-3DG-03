namespace Domain.Factory;

using Domain.Model;

public class PrivacyPolicyFactory : IPrivacyPolicyFactory
{
    public PrivacyPolicy NewPrivacyPolicy(string content)
    {
        return new PrivacyPolicy(content);
    }
}