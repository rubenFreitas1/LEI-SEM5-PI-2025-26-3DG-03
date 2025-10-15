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

    public async Task<Staff?> GetStaffByIDAsync(long id)
    {
        StaffDataModel? staffDM = await _context.Set<StaffDataModel>()
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
        .SingleOrDefaultAsync(s => s.Phone == phone);
        if (staffDM != null)
        {
            Staff staff = _sMapper.ToDomain(staffDM);
            return staff;
        }
        return null;
    }
    public async Task<Staff?> GetStaffByNameAsync(String name)
    { 
        StaffDataModel? staffDM = await _context.Set<StaffDataModel>()
        .SingleOrDefaultAsync(s => s.Name == name);
        if (staffDM != null)
        {
            Staff staff = _sMapper.ToDomain(staffDM);
            return staff;
        }
        return null;
    }
    public async Task<Staff> AddStaff(Staff staff)
    {
        try
        {
            StaffDataModel staffDM = _sMapper.ToDataModel(staff);
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
}