import React from 'react';

import { Box, Flex, Checkbox } from '@strapi/design-system';
import { useTracking } from '@strapi/helper-plugin';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import styled, { css } from 'styled-components';

import { checkIfAttributeIsDisplayable } from '../../../../utils';
import { onChangeListHeaders } from '../../actions';
import { selectDisplayedHeaders } from '../../selectors';

const activeCheckboxWrapperStyles = css`
  background: ${(props) => props.theme.colors.primary100};
  svg {
    opacity: 1;
  }
  border-radius: ${({ theme }) => theme.borderRadius};
`;

const CheckboxWrapper = styled(Box)`
  /* Show active style both on hover and when the action is selected */
  ${(props) => props.isActive && activeCheckboxWrapperStyles}
  &:hover {
    ${activeCheckboxWrapperStyles}
  }
`;

export const FieldPicker = ({ layout }) => {
  const dispatch = useDispatch();
  const displayedHeaders = useSelector(selectDisplayedHeaders);
  const { trackUsage } = useTracking();
  const { formatMessage } = useIntl();

  const allAllowedHeaders = getAllAllowedHeaders(layout.contentType.attributes).map((attrName) => {
    const metadatas = layout.contentType.metadatas[attrName].list;

    return {
      name: attrName,
      intlLabel: { id: metadatas.label, defaultMessage: metadatas.label },
    };
  });

  const values = displayedHeaders.map(({ name }) => name);

  const isSelected = (headerName) => values.includes(headerName);

  const handleChange = (headerName) => {
    trackUsage('didChangeDisplayedFields');

    // remove a header
    if (values.includes(headerName)) {
      dispatch(onChangeListHeaders({ name: headerName, value: true }));
    } else {
      dispatch(onChangeListHeaders({ name: headerName, value: false }));
    }
  };

  return (
    <Flex width="100%" direction="column" alignItems="start">
      {allAllowedHeaders.map((header) => (
        <CheckboxWrapper
          padding={2}
          width="100%"
          key={header.name}
          isActive={isSelected(header.name)}
        >
          <Checkbox
            onChange={() => handleChange(header.name)}
            value={isSelected(header.name) && header.name}
          >
            {formatMessage({
              id: header.intlLabel.id || header.name,
              defaultMessage: header.intlLabel.defaultMessage || header.name,
            })}
          </Checkbox>
        </CheckboxWrapper>
      ))}
    </Flex>
  );
};

FieldPicker.propTypes = {
  layout: PropTypes.shape({
    contentType: PropTypes.shape({
      attributes: PropTypes.object.isRequired,
      metadatas: PropTypes.object.isRequired,
      layouts: PropTypes.shape({
        list: PropTypes.array.isRequired,
      }).isRequired,
      options: PropTypes.object.isRequired,
      settings: PropTypes.object.isRequired,
    }).isRequired,
  }).isRequired,
};

const getAllAllowedHeaders = (attributes) => {
  const allowedAttributes = Object.keys(attributes).reduce((acc, current) => {
    const attribute = attributes[current];

    if (checkIfAttributeIsDisplayable(attribute)) {
      acc.push(current);
    }

    return acc;
  }, []);

  return allowedAttributes.sort();
};
