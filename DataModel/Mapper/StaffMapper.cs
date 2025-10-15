namespace DataModel.Mapper;

using DataModel.Model;
using Domain.Factory;
using Domain.Model;

public class StaffMapper
{
    private IStaffFactory _staffFactory;
    private QualificationMapper _qualificationMapper;

    public StaffMapper(IStaffFactory staffFactory, QualificationMapper qualificationMapper)
    {
        _staffFactory = staffFactory;
        _qualificationMapper = qualificationMapper;
    }

    public Staff ToDomain(StaffDataModel staffDM)
    {
        var qualificationsData = staffDM.Qualification ?? Enumerable.Empty<QualificationDataModel>();
        var qualifications = _qualificationMapper.ToDomain(qualificationsData);

        Staff staffDomain = _staffFactory.NewStaff(staffDM.Name!, qualifications, staffDM.Email!, staffDM.Phone!);
        staffDomain.Id = staffDM.Id;
        return staffDomain;
    }

    public StaffDataModel ToDataModel(Staff staff)
    {
        StaffDataModel staffDM = new StaffDataModel(staff);
        return staffDM;
    }
}