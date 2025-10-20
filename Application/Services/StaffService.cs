namespace Application.Services;

using Domain.Model;

using Microsoft.EntityFrameworkCore;
using Domain.IRepository;
using ShippingManagement.Domain.Qualifications;
using Application.DTO;

public class StaffService
{
    private readonly IStaffRepository _staffRepository;
    public StaffService(IStaffRepository staffRepository)
    {
        _staffRepository = staffRepository;
    }

    public async Task<IEnumerable<StaffDTO>> GetStaffByName(String name)
    {
        IEnumerable<Staff> staffs = await _staffRepository.GetStaffByNameAsync(name);
        List<StaffDTO> StaffDTOs = new List<StaffDTO>();
        foreach (var s in staffs)
        {
            StaffDTOs.Add(StaffDTO.ToDTO(s));
        }
        return StaffDTOs;
    }

    public async Task<StaffDTO?> GetStaffByID(long id)
    {
        Staff? staff = await _staffRepository.GetStaffByIDAsync(id);
        if (staff == null)
        {
            return null;
        }
        return StaffDTO.ToDTO(staff);
    }

    public async Task<IEnumerable<StaffDTO>> GetStaffByQualification(string qualificationCode)
    {
        IEnumerable<Staff> staffs = await _staffRepository.GetStaffByQualificationCodeAsync(qualificationCode);
        List<StaffDTO> StaffDTOs = new List<StaffDTO>();
        foreach (var s in staffs)
        {
            StaffDTOs.Add(StaffDTO.ToDTO(s));
        }
        return StaffDTOs;
    }

    public async Task<IEnumerable<StaffDTO>> GetStaffByStatus(ResourceStatus status, List<string> errorMessages)
    {
        if (status != ResourceStatus.Available && status != ResourceStatus.Unavailable)
        {
            errorMessages.Add("At least one valid QualificationCode must be provided to update a Staff.");
            return Enumerable.Empty<StaffDTO>();
        }
        IEnumerable<Staff> staffs = await _staffRepository.GetStaffByStatusAsync(status);
        List<StaffDTO> StaffDTOs = new List<StaffDTO>();
        foreach (var s in staffs)
        {
            StaffDTOs.Add(StaffDTO.ToDTO(s));
        }
        return StaffDTOs;
    }

    public async Task<IEnumerable<StaffDTO>> GetAllStaff()
    {
        var staffs = await _staffRepository.GetAllStaffAsync();
        var list = new List<StaffDTO>();
        foreach (var s in staffs)
        {
            list.Add(StaffDTO.ToDTO(s));
        }
        return list;
    }
    
    public async Task<StaffDTO?> AddStaff(StaffDTO staffDTO, IEnumerable<Qualification> qualifications, List<String> errorMessages)
    {
        if (qualifications == null || !qualifications.Any())
        {
            errorMessages.Add("At least one valid QualificationCode must be provided to update a Staff.");
            return null;
        }
        if (staffDTO.Status != ResourceStatus.Available && staffDTO.Status != ResourceStatus.Unavailable)
        {
            errorMessages.Add("Staff status must be either Available(0) or Unavailable(1).");
            return null;
        }
        Staff staff;
        if (staffDTO.Id.HasValue)
        {
            Staff? staffByID = await _staffRepository.GetStaffByIDAsync(staffDTO.Id.Value);
            if (staffByID != null)
            {
                errorMessages.Add($"Staff with ID '{staffDTO.Id}' already exist.");
                return null;
            }
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
            OperationalWindow opWindow = OperationalWindowDTO.ToDomain(staffDTO.OperationalWindow!);
            staff = StaffDTO.ToDomain(staffDTO, qualifications, opWindow);
        }
        catch (Exception ex)
        {
            errorMessages.Add("Error creating Staff : " + ex.Message);
            return null;
        }

        Staff staffSaved = await _staffRepository.AddStaff(staff);
        StaffDTO sDTO = StaffDTO.ToDTO(staffSaved);
        return sDTO;
    }

    public async Task<bool> UpdateStaff(long id, StaffDTO staffDTO, IEnumerable<Qualification> qualifications, List<string> errorMessages)
    {
        if (staffDTO.Status != ResourceStatus.Available && staffDTO.Status != ResourceStatus.Unavailable)
        {
            errorMessages.Add("Staff status must be either Available(0) or Unavailable(1).");
            return false;
        }
        Staff? staffByID = await _staffRepository.GetStaffByIDAsync(id);

        Staff? staffByEmail = await _staffRepository.GetStaffByEmailAsync(staffDTO.Email!);
        if (staffByEmail != null && staffByEmail.Id != staffByID?.Id)
        {
            errorMessages.Add($"Staff with email '{staffDTO.Email}' already exists.");
            return false;
        }

        Staff? staffByPhone = await _staffRepository.GetStaffByPhoneAsync(staffDTO.Phone!);
        if (staffByPhone != null && staffByPhone.Id != staffByID?.Id)
        {
            errorMessages.Add($"Staff with phone '{staffDTO.Phone}' already exists.");
            return false;
        }
        Staff? staff = await _staffRepository.GetStaffByIDAsync(id);
        if (staff == null)
        {
            errorMessages.Add("Staff not found");
            return false;
        }
        OperationalWindow opWindow = OperationalWindowDTO.ToDomain(staffDTO.OperationalWindow!);
        try
        {
            staff.ChangeName(staffDTO.Name!);
            staff.ChangeEmail(staffDTO.Email!);
            staff.ChangePhone(staffDTO.Phone!);
            staff.ChangeQualifications(qualifications);
            staff.ChangeStatus(staffDTO.Status!.Value);
            staff.ChangeOperationalWindow(opWindow);
            await _staffRepository.Update(staff, errorMessages);
            return true;
        }
        catch (Exception ex)
        {
            errorMessages.Add("Error updating Staff properties: " + ex.Message);
            return false;
        }
    }
}