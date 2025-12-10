namespace DataModel.Configurations;

using DataModel.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class PrivacyPolicyConfiguration : IEntityTypeConfiguration<PrivacyPolicyDataModel>
{
    public void Configure(EntityTypeBuilder<PrivacyPolicyDataModel> builder)
    {
        builder.HasKey(pp => pp.Id);

        builder.Property(pp => pp.Content)
            .IsRequired();

        builder.Property(pp => pp.CreatedAt)
            .IsRequired();

        builder.Property(pp => pp.IsCurrent)
            .IsRequired();
    }
}
