namespace DataModel.Repository;

using System.Runtime.Serialization.Formatters;
using DataModel.Mapper;
using DataModel.Model;
using Domain.IRepository;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Domain.Model;


public class ShippingAgentOrganizationRepository : GenericRepository<ShippingAgentOrganization>, IShippingAgentOrganizationRepository
{
    ShippingAgentOrganizationMapper _saMapper;

    public ShippingAgentOrganizationRepository(ShippingManagementContext context, ShippingAgentOrganizationMapper mapper) : base(context!)
    {
        _saMapper = mapper;
    }

    public async Task<IEnumerable<ShippingAgentOrganization>> GetShippingAgentOrganizationsAsync()
    {
        try
        {
            IEnumerable<ShippingAgentOrganizationDataModel> saDataModels = await _context.Set<ShippingAgentOrganizationDataModel>()
            .ToListAsync();
            IEnumerable<ShippingAgentOrganization> shippingAgents = _saMapper.ToDomain(saDataModels);
            return shippingAgents;
        }
        catch
        {
            throw;
        }
    }

    public async Task<ShippingAgentOrganization?> GetShippingAgentOrganizationByCodeAsync(string code)
    {
        try
        {
            ShippingAgentOrganizationDataModel? saDM = await _context.Set<ShippingAgentOrganizationDataModel>()
            .SingleOrDefaultAsync(sa => sa.Code == code);
            if (saDM != null)
            {
                ShippingAgentOrganization sa = _saMapper.ToDomain(saDM);
                return sa;
            }
            return null;
        }
        catch
        {
            return null; throw;
        }
    }

    public async Task<ShippingAgentOrganization?> GetShippingAgentOrganizationByIdAsync(long id)
    {
        try
        {
            ShippingAgentOrganizationDataModel? saDM = await _context.Set<ShippingAgentOrganizationDataModel>()
            .SingleOrDefaultAsync(sa => sa.Id == id);
            if (saDM != null)
            {
                ShippingAgentOrganization sa = _saMapper.ToDomain(saDM);
                return sa;
            }
            return null;
        }
        catch
        {
            return null; throw;
        }
    }

    public async Task<ShippingAgentOrganization?> GetShippingAgentOrganizationByLegalNameAsync(string legalName)
    {
        try
        {
            ShippingAgentOrganizationDataModel? saDM = await _context.Set<ShippingAgentOrganizationDataModel>()
            .SingleOrDefaultAsync(sa => sa.LegalName == legalName);
            if (saDM != null)
            {
                ShippingAgentOrganization sa = _saMapper.ToDomain(saDM);
                return sa;
            }
            return null;
        }
        catch
        {
            return null; throw;
        }
    }

    public async Task<ShippingAgentOrganization?> GetShippingAgentOrganizationByAlternativeNameAsync(string altarnativeName)
    {
        try
        {
            ShippingAgentOrganizationDataModel? saDM = await _context.Set<ShippingAgentOrganizationDataModel>()
            .SingleOrDefaultAsync(sa => sa.AlternativeName == altarnativeName);
            if (saDM != null)
            {
                ShippingAgentOrganization sa = _saMapper.ToDomain(saDM);
                return sa;
            }
            return null;
        }
        catch
        {
            return null; throw;
        }
    }

    public async Task<ShippingAgentOrganization?> GetShippingAgentOrganizationByTaxNumberAsync(string taxNumber)
    {
        try
        {
            ShippingAgentOrganizationDataModel? saDM = await _context.Set<ShippingAgentOrganizationDataModel>()
            .SingleOrDefaultAsync(sa => sa.TaxNumber == taxNumber);
            if (saDM != null)
            {
                ShippingAgentOrganization sa = _saMapper.ToDomain(saDM);
                return sa;
            }
            return null;
        }
        catch
        {
            return null; throw;
        }
    }

    public async Task<ShippingAgentOrganization?> GetShippingAgentOrganizationByAddressAsync(string address)
    {
        try
        {
            ShippingAgentOrganizationDataModel? saDM = await _context.Set<ShippingAgentOrganizationDataModel>()
            .SingleOrDefaultAsync(sa => sa.Address == address);
            if (saDM != null)
            {
                ShippingAgentOrganization sa = _saMapper.ToDomain(saDM);
                return sa;
            }
            return null;
        }
        catch
        {
            return null; throw;
        }
    }


    public async Task<ShippingAgentOrganization> AddShippingAgentOrganization(ShippingAgentOrganization sa)
    {
        try
        {
            ShippingAgentOrganizationDataModel saDM = _saMapper.ToDataModel(sa);
            EntityEntry<ShippingAgentOrganizationDataModel> shippingAgentDM_EE = _context.Set<ShippingAgentOrganizationDataModel>().Add(saDM);
            await _context.SaveChangesAsync();
            ShippingAgentOrganizationDataModel addedEntry = shippingAgentDM_EE.Entity;
            ShippingAgentOrganization addedSA = _saMapper.ToDomain(addedEntry);
            return addedSA;
        }
        catch
        {
            throw;
        }
    }

    public async Task<ShippingAgentOrganization?> Update(ShippingAgentOrganization sa, List<string> errorMessages)
    {
        try
        {
            var shippingAgentDataModel = await _context.Set<ShippingAgentOrganizationDataModel>()
                .FirstOrDefaultAsync(v => v.Id == sa.Id);

            if (shippingAgentDataModel == null)
            {
                errorMessages.Add("Shipping Agent Organization not found.");
                return null;
            }
            _saMapper.UpdateDataModelAsync(shippingAgentDataModel, sa, _context);
            await _context.SaveChangesAsync();
            return _saMapper.ToDomain(shippingAgentDataModel);
        }
        catch (DbUpdateConcurrencyException)
        {
            errorMessages.Add("Concurrency error occurred while updating the Shipping Agent Organization.");
            return null;
        }
        catch (Exception ex)
        {
            errorMessages.Add($"Unexpected error: {ex.Message}");
            throw;
        }
    }

    public async Task<bool> ShippingAgentOrganizationExists(long id)
    {
        return await _context.Set<ShippingAgentOrganizationDataModel>().AnyAsync(sa => sa.Id == id);
    }
}
