import React, { useState } from "react";
import Icon from "metabase/components/Icon";
import PropTypes from "prop-types";

const propTypes = {
  open: PropTypes.object,
  children: PropTypes.object,
  title: PropTypes.object,
};

const Collapsible = ({ open, children, title }) => {
  const [isOpen, setIsOpen] = useState(open);

  const handleFilterOpening = () => {
    setIsOpen(prev => !prev);
  };

  return (
    <>
      <div className="card">
        <div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <p style={{ fontWeight: "bold", marginRight: "10px" }}>{title}</p>
            <button
              type="button"
              className="btn"
              onClick={handleFilterOpening}
              style={{ marginLeft: "auto" }}
            >
              {!isOpen ? (
                <Icon className="text-light" name="chevrondown" size={20} />
              ) : (
                <Icon className="text-light" name="chevronup" size={20} />
              )}
            </button>
          </div>
        </div>

        <div className="border-bottom">
          <div>{isOpen && <div className="p-3">{children}</div>}</div>
        </div>
      </div>
    </>
  );
};

Collapsible.propTypes = propTypes;

export default Collapsible;
