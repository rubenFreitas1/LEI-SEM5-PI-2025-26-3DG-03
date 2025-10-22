using DataModel.Model;
using Domain.Model.Resources;
using Domain.Model;
using Domain.Factory;
using System.Collections.Generic;
using System.Linq;

namespace DataModel.Mapper
{
    public class PhysicalResourceMapper
    {
        private readonly IPhysicalResourceFactory _factory;
        private readonly QualificationMapper _qualificationMapper;

        public PhysicalResourceMapper(IPhysicalResourceFactory factory, QualificationMapper qualificationMapper)
        {
            _factory = factory;
            _qualificationMapper = qualificationMapper;
        }

        public PhysicalResource ToDomain(PhysicalResourceDataModel dm)
        {
            var quals = (dm.QualificationRequirements ?? Enumerable.Empty<QualificationDataModel>()).Select(q => _qualificationMapper.ToDomain(q)).ToList();


            var operationalWindow = new OperationalWindow(dm.StartDay, dm.EndDay, dm.StartTime, dm.EndTime);

            var resource = _factory.NewPhysicalResource(dm.Code!, dm.Name!, dm.Description!, dm.Kind, quals, dm.OperationalCapacity, operationalWindow, dm.SetupTimeMinutes);
            resource.Id = dm.Id;


            if (!string.IsNullOrWhiteSpace(dm.AssignedStorageAreaCode))
                resource.AssignToStorageArea(dm.AssignedStorageAreaCode);
            else if (!string.IsNullOrWhiteSpace(dm.AssignedDockName))
                resource.AssignToDock(dm.AssignedDockName);


            resource.ChangeStatus(dm.Status);
            return resource;
        }

        public PhysicalResourceDataModel ToDataModel(PhysicalResource resource)
        {
            return new PhysicalResourceDataModel(resource);
        }

        public void UpdateDataModel(PhysicalResourceDataModel dm, PhysicalResource resource)
        {
            dm.Name = resource.Name;
            dm.Description = resource.PhysicalResourceDescription;
            dm.Kind = resource.PhysicalResourceKind;
            dm.SetupTimeMinutes = resource.PhysicalResourceSetupTimeMinutes;
            dm.OperationalCapacity = resource.PhysicalResourceOperationalCapacity;
            dm.AssignedStorageAreaCode = resource.PhysicalResourceAssignedStorageAreaCode;
            dm.AssignedDockName = resource.PhysicalResourceAssignedDockName;
            dm.StartDay = resource.OperationalWindow.StartDay;
            dm.EndDay = resource.OperationalWindow.EndDay;
            dm.StartTime = resource.OperationalWindow.StartTime;
            dm.EndTime = resource.OperationalWindow.EndTime;
            dm.Status = resource.Status;
        }
    }
}
