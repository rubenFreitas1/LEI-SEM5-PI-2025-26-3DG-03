namespace Application.Services;

using Domain.Model;

using Microsoft.EntityFrameworkCore;
using Domain.IRepository;
using Application.DTO;

public class StaffService
{
    private readonly IStaffRepository _staffRepository;
    public StaffService(IStaffRepository staffRepository)
    {
        _staffRepository = staffRepository;
    }
    
    public async Task<StaffDTO?> GetStaffByName(String name){
        Staff? staff = await _staffRepository.GetStaffByNameAsync(name);
        if (staff != null)
        {
            StaffDTO staffDTO = StaffDTO.ToDTO(staff);
            return staffDTO;
        }
        return null;
    }

    public async Task<StaffDTO?> AddStaff(StaffDTO staffDTO, List<String> errorMessages)
    {
        Staff staff;
        Staff? staffByID = await _staffRepository.GetStaffByIDAsync(staffDTO.Id!.Value);
        if (staffByID != null)
        {
            errorMessages.Add($"Staff with ID '{staffDTO.Id}' already exist.");
            return null;
        }

        Staff? staffByEmail = await _staffRepository.GetStaffByEmailAsync(staffDTO.Email!);
        if (staffByEmail != null)
        {
            errorMessages.Add($"Staff with email '{staffDTO.Email}' already exists.");
            return null;
        }

        Staff? staffByPhone = await _staffRepository.GetStaffByPhoneAsync(staffDTO.Phone!);
        if (staffByPhone != null)
        {
            errorMessages.Add($"Staff with phone '{staffDTO.Phone}' already exists.");
            return null;
        }

        try
        {
            staff = StaffDTO.ToDomain(staffDTO);
        }
        catch (Exception ex)
        {
            errorMessages.Add("Error in converting DTO to Domain: " + ex.Message);
            return null;
        }

        Staff staffSaved = await _staffRepository.AddStaff(staff);
        StaffDTO sDTO = StaffDTO.ToDTO(staffSaved);
        return sDTO;
    }
}