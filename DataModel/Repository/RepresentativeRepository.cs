namespace DataModel.Repository;

using DataModel.Mapper;
using DataModel.Model;
using Domain.IRepository;
using Microsoft.EntityFrameworkCore;
using Domain.Model;
using Microsoft.EntityFrameworkCore.ChangeTracking;

public class RepresentativeRepository : GenericRepository<Representative>, IRepresentativeRepository
{
    RepresentativeMapper _repMapper;

    public RepresentativeRepository(ShippingManagementContext context, RepresentativeMapper mapper) : base(context!)
    {
        _repMapper = mapper;
    }

    public async Task<IEnumerable<Representative>> GetRepresentativesAsync()
    {
        try
        {
            IEnumerable<RepresentativeDataModel> representativeDataModels = await _context.Set<RepresentativeDataModel>()
            .Include(r => r.Organization)
            .ToListAsync();
            IEnumerable<Representative> representatives = _repMapper.ToDomain(representativeDataModels);
            return representatives;
        }
        catch
        {
            throw;
        }
    }

    public async Task<Representative?> GetRepresentativeByCitizenIdAsync(string citizenId)
    {
        try
        {
            RepresentativeDataModel? representativeDM = await _context.Set<RepresentativeDataModel>()
            .Include(r => r.Organization)
            .SingleOrDefaultAsync(r => r.CitizenId == citizenId);
            if (representativeDM != null)
            {
                Representative representative = _repMapper.ToDomain(representativeDM);
                return representative;
            }
            return null;
        }
        catch
        {
            return null; throw;
        }

    }

    public async Task<Representative?> GetRepresentativeByEmailAsync(string email)
    {
        try
        {
            RepresentativeDataModel? representativeDM = await _context.Set<RepresentativeDataModel>()
            .Include(r => r.Organization)
            .SingleOrDefaultAsync(r => r.Email == email);
            if (representativeDM != null)
            {
                Representative representative = _repMapper.ToDomain(representativeDM);
                return representative;
            }
            return null;
        }
        catch
        {
            return null; throw;
        }

    }

    public async Task<Representative?> GetRepresentativeByNationalityAsync(string nationality)
    {
        try
        {
            RepresentativeDataModel? representativeDM = await _context.Set<RepresentativeDataModel>()
            .Include(r => r.Organization)
            .SingleOrDefaultAsync(r => r.Nationality == nationality);
            if (representativeDM != null)
            {
                Representative representative = _repMapper.ToDomain(representativeDM);
                return representative;
            }
            return null;
        }
        catch
        {
            return null; throw;
        }
    }

    public async Task<Representative?> GetRepresentativeByOrganizationAsync(ShippingAgentOrganization organization)
    {
        try
        {
            RepresentativeDataModel? representativeDM = await _context.Set<RepresentativeDataModel>()
            .Include(r => r.Organization)
            .SingleOrDefaultAsync(r => r.Organization!.Id == organization.Id);
            if (representativeDM != null)
            {
                Representative representative = _repMapper.ToDomain(representativeDM);
                return representative;
            }
            return null;
        }
        catch
        {
            return null; throw;
        }
    }

    public async Task<Representative?> GetRepresentativeByNameAsync(string name)
    {
        try
        {
            RepresentativeDataModel? representativeDM = await _context.Set<RepresentativeDataModel>()
            .Include(r => r.Organization)
            .SingleOrDefaultAsync(r => r.Name == name);
            if (representativeDM != null)
            {
                Representative representative = _repMapper.ToDomain(representativeDM);
                return representative;
            }
            return null;
        }
        catch
        {
            return null; throw;
        }

    }

    public async Task<Representative?> GetRepresentativeByPhoneNumberAsync(string phoneNumber)
    {
        try
        {
            RepresentativeDataModel? representativeDM = await _context.Set<RepresentativeDataModel>()
            .Include(r => r.Organization)
            .SingleOrDefaultAsync(r => r.PhoneNumber == phoneNumber);
            if (representativeDM != null)
            {
                Representative representative = _repMapper.ToDomain(representativeDM);
                return representative;
            }
            return null;
        }
        catch
        {
            return null; throw;
        }

    }

    public async Task<Representative?> GetRepresentativeByIdAsync(long id)
    {
        try
        {
            RepresentativeDataModel? representativeDM = await _context.Set<RepresentativeDataModel>()
            .Include(r => r.Organization)
            .SingleOrDefaultAsync(r => r.Id == id);
            if (representativeDM != null)
            {
                Representative representative = _repMapper.ToDomain(representativeDM);
                return representative;
            }
            return null;
        }
        catch
        {
            return null; throw;
        }

    }

    public async Task<Representative> AddRepresentative(Representative representative)
    {
        try
        {
            RepresentativeDataModel representativeDM = _repMapper.ToDataModel(representative);
            var shippingAgent = await _context.Set<ShippingAgentOrganizationDataModel>().Where(o => o.Id == representative.Organization!.Id).FirstOrDefaultAsync();
            representativeDM.Organization = shippingAgent;
            EntityEntry<RepresentativeDataModel> representativeDM_EE = _context.Set<RepresentativeDataModel>().Add(representativeDM);
            await _context.SaveChangesAsync();
            RepresentativeDataModel representativeDataModelSaved = representativeDM_EE.Entity;
            Representative representativeSaved = _repMapper.ToDomain(representativeDataModelSaved);
            return representativeSaved;
        }
        catch
        {
            throw;
        }
    }

    public async Task<Representative?> Update(Representative representative, List<string> errorMessages)
    {
        try
        {
            var representativeDataModel = await _context.Set<RepresentativeDataModel>()
            .Include(r => r.Organization)
            .SingleOrDefaultAsync(r => r.Id == representative.Id);
            
            if (representativeDataModel == null)
            {
                errorMessages.Add("Representative not found.");
                return null;
            }

            await _repMapper.UpdateDataModelAsync(representativeDataModel, representative, _context);
            await _context.SaveChangesAsync();
            return _repMapper.ToDomain(representativeDataModel);
        }
        catch (DbUpdateConcurrencyException)
        {
            errorMessages.Add("Concurrency error occurred while updating the Representative.");
            return null;
        }
        catch (Exception ex)
        {
            errorMessages.Add($"An error occurred: {ex.Message}");
            return null;
        }
    }

    public async Task<bool> RepresentativeExists(long id)
    {
        return await _context.Set<RepresentativeDataModel>().AnyAsync(r => r.Id == id);
    }

}