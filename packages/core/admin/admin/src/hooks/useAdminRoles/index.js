import { useFetchClient } from '@strapi/helper-plugin';
import { useQuery } from 'react-query';

export const useAdminRoles = (params = {}, queryOptions = {}) => {
  const { id = '', ...queryParams } = params;

  const { get } = useFetchClient();
  const { data, error, isError, isLoading, refetch } = useQuery(
    ['roles', id, queryParams],
    async () => {
      const { data } = await get(`/admin/roles/${id ?? ''}`, {
        params: queryParams,
      });

      return data;
    },
    queryOptions
  );

  let roles = [];

  if (id && data) {
    roles = [data.data];
  } else if (Array.isArray(data?.data)) {
    roles = data.data;
  }

  return { roles, error, isError, isLoading, refetch };
};
