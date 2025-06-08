import React, { useEffect, useState } from 'react';

import { EventDispatcher } from '../../../../shared/utils/EventDispatcher';
import { LocalProjectsModel, ProjectItem } from '@noodl-utils/LocalProjectsModel';
import { ProjectModel } from '@noodl-models/projectmodel';
import { App } from '@noodl-models/app';
import { ToastLayer } from '../../views/ToastLayer/ToastLayer';

import { Launcher } from '../../../../../../noodl-core-ui/src/preview/launcher/Launcher/Launcher';
import { LauncherProjectData, CloudSyncType } from '../../../../../../noodl-core-ui/src/preview/launcher/Launcher/components/LauncherProjectCard/LauncherProjectCard';
import { BaseWindow } from '../../views/windows/BaseWindow';

import { AppRoute } from '../AppRoute';

export interface LauncherPageProps {
  route: AppRoute;
}

function convertProjectToLauncherData(project: ProjectItem): LauncherProjectData {
  // Use thumbURI directly, empty string if not available
  const imageSrc = project.thumbURI || '';

  return {
    id: project.id,
    title: project.name,
    imageSrc: imageSrc, 
    localPath: project.retainedProjectDirectory,
    lastOpened: new Date(project.latestAccessed).toISOString(),
    cloudSyncMeta: {
      type: CloudSyncType.None, // TODO: Determine actual cloud sync type
      source: undefined
    },
    uncommittedChangesAmount: undefined,
    pullAmount: undefined,
    pushAmount: undefined,
    contributors: []
  };
}

export function LauncherPage({ route }: LauncherPageProps) {
  const [projectsData, setProjectsData] = useState<LauncherProjectData[]>([]);
  const [localProjectsModel] = useState(() => LocalProjectsModel.instance);

  useEffect(() => {
    // Load recent projects
    const loadProjects = async () => {
      try {
        await localProjectsModel.fetch();
        const recentProjects = localProjectsModel.getProjects();
        const projects = recentProjects.map(convertProjectToLauncherData);
        setProjectsData(projects);
      } catch (error) {
        console.error('Failed to load projects:', error);
      }
    };

    loadProjects();

    // Listen for project updates
    const handleProjectsChanged = () => {
      const recentProjects = localProjectsModel.getProjects();
      const projects = recentProjects.map(convertProjectToLauncherData);
      setProjectsData(projects);
    };

    localProjectsModel.on('myProjectsChanged', handleProjectsChanged, 'launcher-page');

    return () => {
      localProjectsModel.off('launcher-page');
    };
  }, [localProjectsModel]);

  const handleOpenProject = async () => {
    // Use the same logic as ProjectsView.onImportExistingProjectClicked
    const { dialog } = require('@electron/remote');
    
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
      });

      if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
        return;
      }

      const direntry = result.filePaths[0];
      const activityId = 'opening-project';

      ToastLayer.showActivity('Opening project', activityId);

      try {
        const project = await localProjectsModel.openProjectFromFolder(direntry);

        if (!project.name) {
          const Path = require('path');
          project.name = Path.basename(direntry);
        }

        // Navigate to editor with the loaded project
        EventDispatcher.instance.emit('projectLoaded', project);
      } catch (e) {
        ToastLayer.showError('Could not open project');
      } finally {
        ToastLayer.hideActivity(activityId);
      }
    } catch (error) {
      console.error('Error opening project:', error);
      ToastLayer.showError('Could not open project');
    }
  };

  const handleCreateProject = () => {
    // Navigate to projects page with create mode enabled
    EventDispatcher.instance.emit('navigateToCreateProject', { from: 'launcher' });
  };

  const handleProjectLoaded = async (projectInfo: { path: string; name: string }) => {
    const activityId = 'loading-project';
    ToastLayer.showActivity('Loading project...', activityId);

    try {
      // Find the project in the recent projects list
      const projects = localProjectsModel.getProjects();
      const projectEntry = projects.find(p => p.retainedProjectDirectory === projectInfo.path);
      
      if (projectEntry) {
        const project = await localProjectsModel.loadProject(projectEntry);
        ToastLayer.hideActivity(activityId);

        if (!project) {
          ToastLayer.showError('Could not load project.');
          return;
        }

        // Emit project loaded event
        EventDispatcher.instance.emit('projectLoaded', project);
      } else {
        // Project not in recent list, try opening from folder
        const project = await localProjectsModel.openProjectFromFolder(projectInfo.path);
        EventDispatcher.instance.emit('projectLoaded', project);
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      ToastLayer.showError('Could not load project.');
    } finally {
      ToastLayer.hideActivity(activityId);
    }
  };

  const handleProjectRemoved = (projectId: string) => {
    localProjectsModel.removeProject(projectId);
  };

  return (
    <BaseWindow title="Pulse">
      <Launcher
        onOpenProject={handleOpenProject}
        onCreateProject={handleCreateProject}
        onProjectLoaded={handleProjectLoaded}
        onProjectRemoved={handleProjectRemoved}
        projectsData={projectsData}
        onMinimize={() => App.instance.minimize()}
        onMaximize={() => App.instance.maximize()}
        onClose={() => App.instance.close()}
      />
    </BaseWindow>
  );
} 