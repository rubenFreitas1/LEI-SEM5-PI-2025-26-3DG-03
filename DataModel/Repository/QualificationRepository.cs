using System.Linq;
using DataModel.Mapper;
using DataModel.Model;
using Domain.IRepository;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using ShippingManagement.Domain.Qualifications;

namespace DataModel.Repository;

public class QualificationRepository : GenericRepository<Qualification>, IQualificationRepository
{
    private readonly QualificationMapper _mapper;

    public QualificationRepository(ShippingManagementContext context, QualificationMapper mapper) : base(context)
    {
        _mapper = mapper;
    }

    public async Task<IEnumerable<Qualification>> GetQualificationsAsync()
    {
        var dms = await _context.Set<QualificationDataModel>().ToListAsync();
        return _mapper.ToDomain(dms);
    }

    public async Task<Qualification?> GetQualificationByCodeAsync(string code)
    {
        var dm = await _context.Set<QualificationDataModel>().FirstOrDefaultAsync(q => q.Code == code);
        if (dm == null) return null;
        return _mapper.ToDomain(dm);
    }

    public async Task<Qualification?> GetQualificationByIdAsync(long id)
    {
        var dm = await _context.Set<QualificationDataModel>().FirstOrDefaultAsync(q => q.Id == id);
        if (dm == null) return null;
        return _mapper.ToDomain(dm);
    }

    public async Task<IEnumerable<Qualification>> GetQualificationsByNameAsync(string name)
    {
        var dms = await _context.Set<QualificationDataModel>()
            .Where(q => q.Name != null && q.Name.Contains(name))
            .ToListAsync();
        return _mapper.ToDomain(dms);
    }

    public async Task<Qualification> AddQualificationAsync(Qualification qualification)
    {
        var dm = _mapper.ToDataModel(qualification);
        EntityEntry<QualificationDataModel> ee = _context.Set<QualificationDataModel>().Add(dm);
        await _context.SaveChangesAsync();
        return _mapper.ToDomain(ee.Entity);
    }

    public async Task<Qualification?> UpdateQualificationAsync(Qualification qualification, List<string> errorMessages)
    {
        var dm = await _context.Set<QualificationDataModel>().FirstOrDefaultAsync(q => q.Id == qualification.Id);
        if (dm == null)
        {
            errorMessages.Add("Qualification not found!");
            return null;
        }

        _mapper.UpdateDataModel(dm, qualification);
        await _context.SaveChangesAsync();
        return _mapper.ToDomain(dm);
    }

    public async Task<bool> QualificationExists(long id)
    {
        return await _context.Set<QualificationDataModel>().AnyAsync(q => q.Id == id);
    }

    public async Task<bool> QualificationCodeExistsAsync(string code)
    {
        return await _context.Set<QualificationDataModel>().AnyAsync(q => q.Code == code);
    }

    public async Task<bool> QualificationNameExistsAsync(string name)
    {
        return await _context.Set<QualificationDataModel>().AnyAsync(q => q.Name == name);
    }

    public async Task<IEnumerable<Qualification>> GetQualificationsByCodesAsync(IEnumerable<string> codes)
    {
        var dms = await _context.Set<QualificationDataModel>()
            .Where(q => q.Code != null && codes.Contains(q.Code))
            .ToListAsync();
        return _mapper.ToDomain(dms);
    }
}
