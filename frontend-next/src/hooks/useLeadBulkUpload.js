import { useState } from 'react';
import { bulkUploadLeads } from '../services/marketingApi';

export const useLeadBulkUpload = (onSuccess) => {
  const [uploadingLeads, setUploadingLeads] = useState(false);

  const handleBulkUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ['xlsx', 'xls', 'csv'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      alert('Please upload only Excel or CSV file.');
      e.target.value = '';
      return;
    }

    setUploadingLeads(true);

    try {
      const response = await bulkUploadLeads(file);

      if (response.success) {
        alert(response.message || 'Leads uploaded successfully.');
        onSuccess?.();
      } else {
        alert(response.message || 'Bulk upload failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Error occurred while uploading leads.');
    } finally {
      setUploadingLeads(false);
      e.target.value = '';
    }
  };

  return {
    uploadingLeads,
    handleBulkUpload,
  };
};