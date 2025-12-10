namespace Domain.Factory;

using Domain.Model;

public interface IPrivacyPolicyFactory
{
    PrivacyPolicy NewPrivacyPolicy(string content);
}