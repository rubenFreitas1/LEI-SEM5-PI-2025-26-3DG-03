using DataModel.Mapper;
using DataModel.Model;
using Domain.IRepository;
using Domain.Model.Resources;
using Domain.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using System.Collections.Generic;
using System.Linq;

namespace DataModel.Repository
{
    public class PhysicalResourceRepository : GenericRepository<PhysicalResource>, IPhysicalResourceRepository
    {
        private readonly PhysicalResourceMapper _mapper;

        public PhysicalResourceRepository(ShippingManagementContext context, PhysicalResourceMapper mapper) : base(context)
        {
            _mapper = mapper;
        }

        public async Task<IEnumerable<PhysicalResource>> GetAllPhysicalResourcesAsync()
        {
            var list = await _context.Set<PhysicalResourceDataModel>().Include(p => p.QualificationRequirements).AsNoTracking().ToListAsync();
            var mappedList = list.Select(dm => _mapper.ToDomain(dm)).Where(r => r != null).Select(r => r!).ToList();
            return mappedList;
        }

        public async Task<PhysicalResource?> GetPhysicalResourceByIdAsync(long id)
        {
            var dm = await _context.Set<PhysicalResourceDataModel>().Include(p => p.QualificationRequirements).SingleOrDefaultAsync(p => p.Id == id);
            if (dm == null) return null;
            return _mapper.ToDomain(dm);
        }

        public async Task<PhysicalResource?> GetPhysicalResourceByCodeAsync(string code)
        {
            var dm = await _context.Set<PhysicalResourceDataModel>().Include(p => p.QualificationRequirements).SingleOrDefaultAsync(p => p.Code == code);
            if (dm == null) return null;
            return _mapper.ToDomain(dm);
        }

        public async Task<IEnumerable<PhysicalResource>> GetPhysicalResourceByDescriptionAsync(string description)
        {
            var list = await _context.Set<PhysicalResourceDataModel>()
                .Include(p => p.QualificationRequirements)
                .Where(p => p.Description == description)
                .AsNoTracking()
                .ToListAsync();
            var mappedList = list.Select(dm => _mapper.ToDomain(dm)).Where(r => r != null).Select(r => r!).ToList();
            return mappedList;
        }

        public async Task<IEnumerable<PhysicalResource>> GetPhysicalResourceByKindAsync(PhysicalResourceKind kind)
        {
            var list = await _context.Set<PhysicalResourceDataModel>()
                .Include(p => p.QualificationRequirements)
                .Where(p => p.Kind == kind)
                .AsNoTracking()
                .ToListAsync();
            var mappedKind = list.Select(dm => _mapper.ToDomain(dm)).Where(r => r != null).Select(r => r!).ToList();
            return mappedKind;
        }

        public async Task<IEnumerable<PhysicalResource>> GetPhysicalResourceByStatusAsync(ResourceStatus status)
        {
            var list = await _context.Set<PhysicalResourceDataModel>()
                .Include(p => p.QualificationRequirements)
                .Where(p => p.Status == status)
                .AsNoTracking()
                .ToListAsync();
            var mappedStatus = list.Select(dm => _mapper.ToDomain(dm)).Where(r => r != null).Select(r => r!).ToList();
            return mappedStatus;
        }
        
        public async Task<PhysicalResource> AddPhysicalResource(PhysicalResource resource)
        {
            var dm = _mapper.ToDataModel(resource);
            
            
            
            if (dm.QualificationRequirements is IEnumerable<QualificationDataModel> qColl)
            {
                var qList = qColl.ToList();
                for (int i = 0; i < qList.Count; i++)
                {
                    var qdm = qList[i];
                    if (qdm != null && qdm.Id != 0)
                    {
                        var existing = await _context.Set<QualificationDataModel>().FindAsync(qdm.Id);
                        if (existing != null) qList[i] = existing;
                    }
                }
                dm.QualificationRequirements = qList;
            }
            EntityEntry<PhysicalResourceDataModel> ee = _context.Set<PhysicalResourceDataModel>().Add(dm);
            await _context.SaveChangesAsync();
            return _mapper.ToDomain(ee.Entity)!;
        }

        public async Task<PhysicalResource?> Update(PhysicalResource resource, List<string> errorMessages)
        {
            try
            {
                var dm = await _context.Set<PhysicalResourceDataModel>().FirstOrDefaultAsync(p => p.Id == resource.Id);
                if (dm == null)
                {
                    errorMessages.Add("Resource not found");
                    return null;
                }

                if (resource.Qualification != null)
                {
                    var codes = resource.Qualification.Select(q => q.Code).Where(c => c != null).Select(c => c!).ToList();
                    var existingQ = await _context.Set<QualificationDataModel>().Where(q => q.Code != null && codes.Contains(q.Code)).ToListAsync();
                    dm.QualificationRequirements = existingQ;
                }

                _mapper.UpdateDataModel(dm, resource);
                await _context.SaveChangesAsync();
                return _mapper.ToDomain(dm);
            }
            catch (DbUpdateConcurrencyException)
            {
                errorMessages.Add("Concurrency error occurred while updating Resource.");
                throw;
            }
            catch (Exception ex)
            {
                errorMessages.Add($"Unexpected error: {ex.Message}");
                throw;
            }
        }
    }
}
