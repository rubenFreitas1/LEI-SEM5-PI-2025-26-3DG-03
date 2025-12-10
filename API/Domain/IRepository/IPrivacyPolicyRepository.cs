namespace Domain.IRepository;

using Domain.Model;

public interface IPrivacyPolicyRepository : IGenericRepository<PrivacyPolicy>
{
    Task<PrivacyPolicy?> GetCurrentPrivacyPolicyAsync();

    Task<PrivacyPolicy> AddPrivacyPolicyAsync(PrivacyPolicy privacyPolicy);

    Task<bool> DeactivatePreviousPoliciesAsync();
        
        Task<IEnumerable<PrivacyPolicy>> GetAllPrivacyPoliciesAsync();
}