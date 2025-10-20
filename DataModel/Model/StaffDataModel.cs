using System.ComponentModel.DataAnnotations;
using Domain.Model;

namespace DataModel.Model
{
    public class StaffDataModel
    {
        public long Id { get; set; }
        [Required]
        public string? Name { get; set; }
        [Required]
        public string? Email { get; set; }
        [Required]
        public string? Phone { get; set; }
        [Required]
        public List<QualificationDataModel>? Qualification { get; set; }
        [Required]
        public OperationalWindow? OperationalWindow { get; set; }
        [Required]
        public ResourceStatus? Status { get; set; }

        public StaffDataModel() { }

        public StaffDataModel(Staff staff)
        {
            Id = staff.Id;
            Name = staff.Name;
            Email = staff.Email;
            Phone = staff.Phone;
            Qualification = staff.Qualification.Select(q => new QualificationDataModel(q)).ToList();
            OperationalWindow = staff.OperationalWindow;
            Status = staff.Status;
        }
    }
}