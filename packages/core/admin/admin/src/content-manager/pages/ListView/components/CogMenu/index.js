import React from 'react';

import { Flex, IconButton, Popover, TextButton, Typography } from '@strapi/design-system';
import { CheckPermissions, LinkButton } from '@strapi/helper-plugin';
import { Cog, Layer } from '@strapi/icons';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useSelector, useDispatch } from 'react-redux';

import { selectAdminPermissions } from '../../../../../pages/App/selectors';
import { getTrad } from '../../../../utils';
import { onResetListHeaders } from '../../actions';
import { FieldPicker } from '../FieldPicker';

export const CogMenu = ({ slug, layout }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const cogButtonRef = React.useRef();
  const permissions = useSelector(selectAdminPermissions);
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();

  const handleToggle = () => {
    setIsVisible((prev) => !prev);
  };

  const handleReset = () => {
    dispatch(onResetListHeaders());
  };

  return (
    <Flex justifyContent="flex-end" height="100%">
      <IconButton
        icon={<Cog />}
        label={formatMessage({
          id: 'app.links.configure-view',
          defaultMessage: 'Configure the view',
        })}
        ref={cogButtonRef}
        onClick={handleToggle}
      />
      {isVisible && (
        <Popover
          placement="bottom-end"
          source={cogButtonRef}
          isVisible={isVisible}
          onDismiss={handleToggle}
          spacing={4}
        >
          <Flex direction="column" gap={3} padding={2}>
            <CheckPermissions
              permissions={permissions.contentManager.collectionTypesConfigurations}
            >
              <LinkButton
                size="S"
                startIcon={<Layer />}
                style={{ width: '100%' }}
                to={`${slug}/configurations/list`}
                variant="secondary"
              >
                {formatMessage({
                  id: 'app.links.configure-view',
                  defaultMessage: 'Configure the view',
                })}
              </LinkButton>
              <Flex width="100%" justifyContent="space-between">
                <Typography variant="pi" fontWeight="bold">
                  {formatMessage({
                    id: getTrad('containers.ListPage.displayedFields'),
                    defaultMessage: 'Displayed fields',
                  })}
                </Typography>
                <TextButton onClick={handleReset}>
                  {formatMessage({
                    id: 'app.components.Button.reset',
                    defaultMessage: 'Reset',
                  })}
                </TextButton>
              </Flex>
            </CheckPermissions>
            <FieldPicker layout={layout} />
          </Flex>
        </Popover>
      )}
    </Flex>
  );
};

CogMenu.propTypes = {
  slug: PropTypes.string.isRequired,
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
