using System.ComponentModel.DataAnnotations;
using Domain.Model;
using ShippingManagement.Domain.Qualifications;

namespace DataModel.Model;

public class StaffDataModel
{
    public long Id { get; set; }
    [Required]
    public String? Name { get; set; }
    [Required]
    public String? Email { get; set; }
    [Required]
    public String? Phone { get; set; }
    [Required]
    public IEnumerable<QualificationDataModel>? Qualification { get; set; }

    public StaffDataModel() { }

    public StaffDataModel(Staff staff)
    {
        Id = staff.Id;
        Name = staff.Name;
        Email = staff.Email;
        Phone = staff.Phone;
        Qualification = staff.Qualification.Select(q => new QualificationDataModel(q)).ToList();
    }
}