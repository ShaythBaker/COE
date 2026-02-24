import React, { useEffect, useState } from 'react';
import { Container } from 'reactstrap';
import { jobsGridData } from '../../../common/data';

//Import Breadcrumb
import Breadcrumbs from "../../../components/Common/Breadcrumb";
import JobFilter from './JobFilter';
import JobData from './JobData';

const JobGrid = () => {
    document.title = "Jobs Grid | Travco - COE - ";

    const [jobGrid, setJobGrid] = useState();

    useEffect(() => {
        setJobGrid(jobsGridData)
    }, [jobsGridData])
    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    {/* Render Breadcrumbs */}
                    <Breadcrumbs title="Jobs" breadcrumbItem="Jobs Grid" />

                    <JobFilter setJobGrid={setJobGrid} jobData={jobsGridData} />
                    <JobData jobGrid={jobGrid} />
                </Container>
            </div>
        </React.Fragment>
    );
}

export default JobGrid;