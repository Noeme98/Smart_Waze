import React from "react";

const PageHeader = ({ title, description, action }) => {
  return (
    <div className="bg-[#151F31] p-12 border-b border-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-extrabold mb-2 tracking-tight text-white">
            {title}
          </h1>
          <p className="text-lg text-gray-300">{description}</p>
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
};

export default PageHeader;