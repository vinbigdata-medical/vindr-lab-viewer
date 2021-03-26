import cookie from 'js-cookie';
import React, { useState } from 'react';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Avatar, Dropdown, Modal, Menu } from 'antd';
import { useSelector } from 'react-redux';
import get from 'lodash/get';
import { TOKEN, REFRESH_TOKEN } from '../../constants/constants';
import { actionLogout, requestLogin } from '../../system/systemAction';
import './VinlabHeader.css';

function Header(props) {
  const { t, useLargeLogo, linkPath, linkText } = props;
  const extensions = useSelector(state => state.extensions);
  const username = get(extensions, 'user.preferred_username');
  const [logo, setLogo] = useState(
    '/medical-view/assets/vinlab/vindr_lab_logo_white.png'
  );

  const hasLink = linkText && linkPath;

  const handleClickAvatar = async item => {
    if (item.key === '/logout') {
      Modal.confirm({
        title: 'Are you sure?',
        content: null,
        onOk: () => {
          if (cookie.get(REFRESH_TOKEN)) {
            actionLogout();
          } else {
            cookie.remove(TOKEN);
            cookie.remove(REFRESH_TOKEN);
            requestLogin(true);
          }
        },
        onCancel: () => {},
      });
    }
  };

  const handlErrorImage = e => {
    setLogo('/assets/vinlab/vindr_lab_logo_white.png');
  };

  const menu = (
    <Menu onClick={handleClickAvatar}>
      <Menu.Item key="/logout">{t('Logout')}</Menu.Item>
    </Menu>
  );

  return (
    <>
      <div className="notification-bar">{t('INVESTIGATIONAL USE ONLY')}</div>
      <div
        className={classNames('entry-header', { 'header-big': useLargeLogo })}
      >
        <div className="header-left-box">
          <a className="header-brand" href="/dashboard">
            <img
              className="img-logo"
              src={logo}
              alt="vindoc logo"
              onError={handlErrorImage}
            />
          </a>
        </div>

        {/* Project name */}
        {hasLink && (
          <a className="header-btn header-studyListLinkSection" href={linkPath}>
            {linkText || ''}
          </a>
        )}

        <div className="header-menu">
          <Dropdown overlay={menu}>
            <div className="user-info">
              <span className="user-name">{username || ''}</span>
              <Avatar size={30} icon="user" />
            </div>
          </Dropdown>
        </div>
      </div>
    </>
  );
}

Header.propTypes = {
  linkText: PropTypes.string,
  linkPath: PropTypes.string,
  useLargeLogo: PropTypes.bool,
  t: PropTypes.func.isRequired,
};

Header.defaultProps = {
  useLargeLogo: false,
};

export default withTranslation(['Header', 'AboutModal'])(Header);
