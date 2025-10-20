namespace DataModel.Repository;

using System.Runtime.Serialization.Formatters;
using DataModel.Mapper;
using DataModel.Model;
using Domain.IRepository;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Domain.Model;

public class StaffRepository : GenericRepository<Staff>, IStaffRepository
{
    StaffMapper _sMapper;

    public StaffRepository(ShippingManagementContext context, StaffMapper mapper) : base(context!)
    {
        _sMapper = mapper;
    }

    public async Task<IEnumerable<Staff>> GetAllStaffAsync()
    {
        var staffDataModels = await _context.Set<StaffDataModel>()
            .Include(s => s.Qualification)
            .AsNoTracking()
            .ToListAsync();

        var result = new List<Staff>();
        foreach (var sdm in staffDataModels)
        {
            result.Add(_sMapper.ToDomain(sdm));
        }
        return result;
    }

    public async Task<Staff?> GetStaffByIDAsync(long id)
    {
        StaffDataModel? staffDM = await _context.Set<StaffDataModel>()
        .Include(s => s.Qualification)
        .SingleOrDefaultAsync(s => s.Id == id);
        if (staffDM != null)
        {
            Staff staff = _sMapper.ToDomain(staffDM);
            return staff;
        }
        return null;
    }
    public async Task<Staff?> GetStaffByEmailAsync(String email)
    {
        StaffDataModel? staffDM = await _context.Set<StaffDataModel>()
        .Include(s => s.Qualification)
        .SingleOrDefaultAsync(s => s.Email == email);
        if (staffDM != null)
        {
            Staff staff = _sMapper.ToDomain(staffDM);
            return staff;
        }
        return null;
    }
    public async Task<Staff?> GetStaffByPhoneAsync(String phone)
    {
        StaffDataModel? staffDM = await _context.Set<StaffDataModel>()
        .Include(s => s.Qualification)
        .SingleOrDefaultAsync(s => s.Phone == phone);
        if (staffDM != null)
        {
            Staff staff = _sMapper.ToDomain(staffDM);
            return staff;
        }
        return null;
    }
    public async Task<IEnumerable<Staff>> GetStaffByNameAsync(string name)
    {
        var staffDMs = await _context.Set<StaffDataModel>()
            .Include(s => s.Qualification)
            .Where(s => s.Name == name)
            .ToListAsync();

        var result = new List<Staff>();
        foreach (var staffDM in staffDMs)
        {
            if (staffDM != null)
                result.Add(_sMapper.ToDomain(staffDM));
        }
        return result;
    }
    public async Task<IEnumerable<Staff>> GetStaffByQualificationCodeAsync(string qualificationCode)
    {
        var staffQuery = _context.Set<StaffDataModel>().AsQueryable();

        var staffList = await staffQuery.AsNoTracking().ToListAsync();

        foreach (var s in staffList)
        {
            await _context.Entry(s)
                .Collection(x => x.Qualification!)
                .LoadAsync();
        }
        var filtered = staffList
            .Where(s => s.Qualification != null && s.Qualification.Any(q => q.Code == qualificationCode))
            .ToList();

        var result = new List<Staff>();
        foreach (var staffDM in filtered)
        {
            result.Add(_sMapper.ToDomain(staffDM));
        }

        return result;
    }

    public async Task<IEnumerable<Staff>> GetStaffByStatusAsync(ResourceStatus status)
    {
        var staffList = await _context.Set<StaffDataModel>().AsNoTracking().ToListAsync();

        foreach (var s in staffList)
        {
            await _context.Entry(s)
                .Collection(x => x.Qualification!)
                .LoadAsync();
        }

        var filtered = staffList
            .Where(s => s.Status == status)
            .ToList();

        var result = new List<Staff>();
        foreach (var staffDM in filtered)
        {
            result.Add(_sMapper.ToDomain(staffDM));
        }

        return result;
    }

    public async Task<Staff> AddStaff(Staff staff)
    {
        try
        {
            StaffDataModel staffDM = _sMapper.ToDataModel(staff);

            if (staffDM.Qualification is IEnumerable<QualificationDataModel> qColl)
            {
                List<QualificationDataModel> qList = qColl.ToList();
                for (int i = 0; i < qList.Count; i++)
                {
                    QualificationDataModel qdm = qList[i];
                    if (qdm != null && qdm.Id != 0)
                    {
                        var existing = await _context.Set<QualificationDataModel>().FindAsync(qdm.Id);
                        if (existing != null)
                        {
                            qList[i] = existing;
                        }
                    }
                }
                staffDM.Qualification = qList;
            }

            EntityEntry<StaffDataModel> staffDM_EE = _context.Set<StaffDataModel>().Add(staffDM);
            await _context.SaveChangesAsync();
            StaffDataModel staffDMSaved = staffDM_EE.Entity;
            Staff staffSaved = _sMapper.ToDomain(staffDMSaved);
            return staffSaved;
        }
        catch
        {
            throw;
        }
    }
    public async Task<Staff?> Update(Staff staff, List<string> errorMessages)
    {
        try
        {
            var staffDataModel = await _context.Set<StaffDataModel>()
            .FirstOrDefaultAsync(s => s.Id == staff.Id);

            if (staffDataModel == null)
            {
                errorMessages.Add("Staff not found!");
                return null;
            }
            if (staff.Qualification != null)
            {
                var codes = staff.Qualification.Select(q => q.Code).Where(c => c != null).Select(c => c!).ToList();
                var existingQ = await _context.Set<QualificationDataModel>()
                    .Where(q => q.Code != null && codes.Contains(q.Code))
                    .ToListAsync();
                staffDataModel.Qualification = existingQ;
            }

            _sMapper.UpdateDataModel(staffDataModel, staff);
            await _context.SaveChangesAsync();
            return _sMapper.ToDomain(staffDataModel);
        }
        catch (DbUpdateConcurrencyException)
        {
            errorMessages.Add("Concurrency error occurred while updating Staff.");
            throw;
        }
        catch (Exception ex)
        {
            errorMessages.Add($"Unexpected error: {ex.Message}");
            throw;
        }
    }
}