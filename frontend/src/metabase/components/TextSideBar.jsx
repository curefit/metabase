/* eslint "react/prop-types": "warn" */
import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import S from "./Sidebar.css";
import LabelIcon from "./LabelIcon";

const TextSideBar = ({ name, sidebar, icon, onClick, active }) => (
  <ol className="mx3">
    <li>
      <button
        onClick={onClick}
        className={classNames(S.item, { [S.selected]: active })}
        style={{ paddingRight: "1rem" }}
      >
        <LabelIcon className={S.icon} icon={icon} />
        <span className={S.name}>{sidebar || name}</span>
      </button>
    </li>
  </ol>
);

TextSideBar.propTypes = {
  name: PropTypes.string.isRequired,
  sidebar: PropTypes.string,
  icon: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  active: PropTypes.bool,
};

export default React.memo(TextSideBar);
