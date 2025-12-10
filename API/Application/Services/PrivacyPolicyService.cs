namespace Application.Services;

using Domain.Model;
using Domain.IRepository;
using Application.DTO;
using Domain.Factory;
using System.ComponentModel;
using NuGet.Protocol.Plugins;
using System.Xml.Schema;
using Microsoft.Extensions.Configuration;
using Application.Services;

public class PrivacyPolicyService
{
    private readonly IPrivacyPolicyRepository _privacyPolicyRepository;
    private readonly IPrivacyPolicyFactory _privacyPolicyFactory;
    private readonly ISystemUserRepository _systemUserRepository;

    public PrivacyPolicyService(IPrivacyPolicyRepository privacyPolicyRepository, IPrivacyPolicyFactory privacyPolicyFactory, ISystemUserRepository systemUserRepository)
    {
        _privacyPolicyRepository = privacyPolicyRepository;
        _privacyPolicyFactory = privacyPolicyFactory;
        _systemUserRepository = systemUserRepository;
    }

    public async Task<PrivacyPolicyDTO?> GetCurrentPrivacyPolicyAsync()
    {
        PrivacyPolicy? privacyPolicy = await _privacyPolicyRepository.GetCurrentPrivacyPolicyAsync();
        if (privacyPolicy != null)
        {
            PrivacyPolicyDTO privacyPolicyDTO = PrivacyPolicyDTO.ToDTO(privacyPolicy);
            return privacyPolicyDTO;
        }
        return null;
    }

    public async Task<PrivacyPolicyDTO> AddPrivacyPolicyAsync(string content)
    {
        await _privacyPolicyRepository.DeactivatePreviousPoliciesAsync();
        PrivacyPolicy newPrivacyPolicy = _privacyPolicyFactory.NewPrivacyPolicy(content);
        PrivacyPolicy addedPrivacyPolicy = await _privacyPolicyRepository.AddPrivacyPolicyAsync(newPrivacyPolicy);
        
        // Reset all users' acceptance when a new policy is created
        Console.WriteLine("[Privacy Policy] Resetting all users' privacy policy acceptance");
        await _systemUserRepository.ResetAllUsersPrivacyPolicyAcceptanceAsync();
        
        PrivacyPolicyDTO privacyPolicyDTO = PrivacyPolicyDTO.ToDTO(addedPrivacyPolicy);
        return privacyPolicyDTO;
    }
        
    public async Task<IEnumerable<PrivacyPolicyDTO>> GetPrivacyPolicyHistoryAsync()
    {
        var policies = await _privacyPolicyRepository.GetAllPrivacyPoliciesAsync();
        return PrivacyPolicyDTO.ToDTO(policies);
    }

    public async Task<PrivacyPolicyCheckResponse> CheckPrivacyPolicyUpdateAsync(string userEmail)
    {
        Console.WriteLine($"[Privacy Policy Check] Checking for user: {userEmail}");
        
        var currentPolicy = await _privacyPolicyRepository.GetCurrentPrivacyPolicyAsync();
        
        if (currentPolicy == null)
        {
            Console.WriteLine("[Privacy Policy Check] No current policy found");
            return new PrivacyPolicyCheckResponse 
            { 
                HasNewPolicy = false,
                CurrentPolicy = null
            };
        }

        Console.WriteLine($"[Privacy Policy Check] Current policy found - ID: {currentPolicy.Id}");

        var user = await _systemUserRepository.GetSystemUserByEmailAsync(userEmail);
        
        if (user == null)
        {
            Console.WriteLine($"[Privacy Policy Check] User not found with email: {userEmail}");
            // User might be a representative, no need to check
            return new PrivacyPolicyCheckResponse 
            { 
                HasNewPolicy = false,
                CurrentPolicy = null
            };
        }

        Console.WriteLine($"[Privacy Policy Check] User found - AcceptedCurrentPrivacyPolicy: {user.AcceptedCurrentPrivacyPolicy}");

        // Check if user needs to accept the current policy
        bool hasNewPolicy = !user.AcceptedCurrentPrivacyPolicy;
        
        Console.WriteLine($"[Privacy Policy Check] HasNewPolicy: {hasNewPolicy}");
        
        return new PrivacyPolicyCheckResponse
        {
            HasNewPolicy = hasNewPolicy,
            CurrentPolicy = hasNewPolicy ? PrivacyPolicyDTO.ToDTO(currentPolicy) : null
        };
    }

    public async Task<bool> AcceptPrivacyPolicyByEmailAsync(string userEmail)
    {
        Console.WriteLine($"[Privacy Policy Accept] Accepting policy for user: {userEmail}");
        
        var user = await _systemUserRepository.GetSystemUserByEmailAsync(userEmail);
        
        if (user == null)
        {
            Console.WriteLine($"[Privacy Policy Accept] User not found: {userEmail}");
            return false;
        }

        Console.WriteLine($"[Privacy Policy Accept] User found - Before update - AcceptedCurrentPrivacyPolicy: {user.AcceptedCurrentPrivacyPolicy}");
        
        user.AcceptPrivacyPolicy();
        
        Console.WriteLine($"[Privacy Policy Accept] After AcceptPrivacyPolicy - AcceptedCurrentPrivacyPolicy: {user.AcceptedCurrentPrivacyPolicy}");
        
        var errorMessages = new List<string>();
        var updateResult = await _systemUserRepository.Update(user, errorMessages);
        
        Console.WriteLine($"[Privacy Policy Accept] Update result: {updateResult}, Errors: {string.Join(", ", errorMessages)}");
        
        // Verify the update was persisted
        var updatedUser = await _systemUserRepository.GetSystemUserByEmailAsync(userEmail);
        Console.WriteLine($"[Privacy Policy Accept] After save - AcceptedCurrentPrivacyPolicy in DB: {updatedUser?.AcceptedCurrentPrivacyPolicy}");
        
        return errorMessages.Count == 0;
    }
}

public class PrivacyPolicyCheckResponse
{
    public bool HasNewPolicy { get; set; }
    public PrivacyPolicyDTO? CurrentPolicy { get; set; }
}