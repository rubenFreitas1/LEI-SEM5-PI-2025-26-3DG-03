namespace Domain.IRepository;

using Domain.Model;

public interface IStaffRepository : IGenericRepository<Staff>
{
    Task<Staff?> GetStaffByIDAsync(long id);
    Task<Staff?> GetStaffByEmailAsync(String email);
    Task<Staff?> GetStaffByPhoneAsync(String phone);
    Task<Staff?> GetStaffByNameAsync(String name);
    Task<Staff> AddStaff(Staff staff);
}