namespace DataModel.Repository;

using DataModel.Mapper;
using DataModel.Model;
using Domain.IRepository;
using Domain.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using System.Collections.Generic;

public class PrivacyPolicyRepository : GenericRepository<PrivacyPolicy>, IPrivacyPolicyRepository
{
    private readonly PrivacyPolicyMapper _privacyPolicyMapper;

    public PrivacyPolicyRepository(ShippingManagementContext context, PrivacyPolicyMapper mapper) : base(context!)
    {
        _privacyPolicyMapper = mapper;
    }

    public async Task<PrivacyPolicy?> GetCurrentPrivacyPolicyAsync()
    {
        try
        {
            PrivacyPolicyDataModel? privacyPolicyDataModel = await _context.Set<PrivacyPolicyDataModel>()
                .FirstOrDefaultAsync(pp => pp.IsCurrent);

            if (privacyPolicyDataModel == null)
            {
                return null;
            }

            PrivacyPolicy privacyPolicy = _privacyPolicyMapper.ToDomainModel(privacyPolicyDataModel);
            return privacyPolicy;
        }
        catch
        {
            throw;
        }
    }
        
        public async Task<IEnumerable<PrivacyPolicy>> GetAllPrivacyPoliciesAsync()
        {
            try
            {
                IEnumerable<PrivacyPolicyDataModel> privacyPolicyDataModels = await _context.Set<PrivacyPolicyDataModel>()
                    .OrderByDescending(pp => pp.CreatedAt)
                    .ToListAsync();
                IEnumerable<PrivacyPolicy> privacyPolicies = _privacyPolicyMapper.ToDomainModel(privacyPolicyDataModels);
                return privacyPolicies;
            }
            catch
            {
                throw;
            }
        }
    public async Task<PrivacyPolicy> AddPrivacyPolicyAsync(PrivacyPolicy privacyPolicy)
    {
        try
        {
            PrivacyPolicyDataModel privacyPolicyDataModel = _privacyPolicyMapper.ToDataModel(privacyPolicy);
            EntityEntry<PrivacyPolicyDataModel> addedEntry = await _context.Set<PrivacyPolicyDataModel>()
                .AddAsync(privacyPolicyDataModel);
            await _context.SaveChangesAsync();
            PrivacyPolicy addedPrivacyPolicy = _privacyPolicyMapper.ToDomainModel(addedEntry.Entity);
            return addedPrivacyPolicy;
        }
        catch
        {
            throw;
        }
    }

    public async Task<bool> DeactivatePreviousPoliciesAsync()
    {
        try
        {
            var previousPolicies = await _context.Set<PrivacyPolicyDataModel>()
                .Where(pp => pp.IsCurrent)
                .ToListAsync();

            foreach (var policy in previousPolicies)
            {
                policy.IsCurrent = false;
            }

            await _context.SaveChangesAsync();
            return true;
        }
        catch
        {
            throw;
        }
    }
    
}