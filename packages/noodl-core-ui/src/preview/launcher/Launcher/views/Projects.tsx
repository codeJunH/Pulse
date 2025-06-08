import React, { useRef, useState, useEffect } from 'react';

import { Icon, IconName } from '@noodl-core-ui/components/common/Icon';
import { PrimaryButton, PrimaryButtonSize, PrimaryButtonVariant } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { Select, SelectColorTheme, SelectOption } from '@noodl-core-ui/components/inputs/Select';
import { TextInput, TextInputVariant } from '@noodl-core-ui/components/inputs/TextInput';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { Columns } from '@noodl-core-ui/components/layout/Columns';
import { HStack } from '@noodl-core-ui/components/layout/Stack';
import { Label, LabelSize } from '@noodl-core-ui/components/typography/Label';
import { TextType } from '@noodl-core-ui/components/typography/Text';
import { useSimpleConfirmationDialog } from '@noodl-core-ui/components/popups/ConfirmationDialog/ConfirmationDialog.hooks';
import { LauncherPage } from '@noodl-core-ui/preview/launcher/Launcher/components/LauncherPage';
import {
  CloudSyncType,
  LauncherProjectCard,
  LauncherProjectData
} from '@noodl-core-ui/preview/launcher/Launcher/components/LauncherProjectCard';
import {
  LauncherSearchBar,
  useLauncherSearchBar
} from '@noodl-core-ui/preview/launcher/Launcher/components/LauncherSearchBar';
import { ProjectSettingsModal } from '@noodl-core-ui/preview/launcher/Launcher/components/ProjectSettingsModal';

// Import types for real project data
export interface ProjectsViewProps {
  onOpenProject?: () => void;
  onCreateProject?: () => void;
  onProjectLoaded?: (project: any) => void;
  onProjectRemoved?: (projectId: string) => void;
  projectsData?: LauncherProjectData[];
}

export function Projects({ 
  onOpenProject,
  onCreateProject, 
  onProjectLoaded,
  onProjectRemoved,
  projectsData = []
}: ProjectsViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [RemoveProjectDialog, confirmRemoveProject] = useSimpleConfirmationDialog({
    title: 'Remove Project',
    confirmButtonLabel: 'Remove',
    cancelButtonLabel: 'Cancel',
    isDangerousAction: true
  });
  const uniqueTypes = [...new Set(projectsData.map((item) => item.cloudSyncMeta.type))];
  const visibleTypesDropdownItems: SelectOption[] = [
    { label: 'All projects', value: 'all' },
    ...uniqueTypes.map((type) => ({ label: `Only ${type.toLowerCase()} projects`, value: type }))
  ];

  const {
    items: projects,
    filterValue,
    setFilterValue,
    searchTerm,
    setSearchTerm
  } = useLauncherSearchBar({
    allItems: projectsData,
    filterDropdownItems: visibleTypesDropdownItems,
    propertyNameToFilter: 'cloudSyncMeta.type'
  });

  function onOpenProjectSettings(projectDataId: LauncherProjectData['id']) {
    setSelectedProjectId(projectDataId);
  }

  function onCloseProjectSettings() {
    setSelectedProjectId(null);
  }

  async function onImportProjectClick() {
    if (onOpenProject) {
      onOpenProject();
    }
  }

  function onNewProjectClick() {
    if (onCreateProject) {
      onCreateProject();
    }
  }

  function onLaunchProject(project: LauncherProjectData) {
    if (onProjectLoaded && project.localPath) {
      // Load project from path
      onProjectLoaded({ path: project.localPath, name: project.title });
    }
  }

  function onRemoveProject(project: LauncherProjectData) {
    // Use the custom confirmation dialog with a personalized message
    const message = `Do you want to remove <strong>"${project.title}"</strong> from the recent projects list?<br><br>The project folder will remain intact and can be opened again later.`;
    
    // Show the dialog with the message
    confirmRemoveProject(message)
      .then(() => {
        // User confirmed - remove the project
        if (onProjectRemoved) {
          onProjectRemoved(project.id);
        }
      })
      .catch(() => {
        // User cancelled - do nothing
      });
  }

  return (
    <LauncherPage
      title="Recent Projects"
      headerSlot={
        <HStack hasSpacing>
          <PrimaryButton
            label="Open project"
            size={PrimaryButtonSize.Small}
            variant={PrimaryButtonVariant.Muted}
            onClick={onImportProjectClick}
          />
          <PrimaryButton label="Create new project" size={PrimaryButtonSize.Small} onClick={onNewProjectClick} />
        </HStack>
      }
    >
      <RemoveProjectDialog />
      <ProjectSettingsModal
        isVisible={selectedProjectId !== null}
        onClose={onCloseProjectSettings}
        projectData={projects.find((project) => project.id === selectedProjectId)}
      />

      <LauncherSearchBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterValue={filterValue}
        setFilterValue={setFilterValue}
        filterDropdownItems={visibleTypesDropdownItems}
      />

      {/* TODO: make project list legend and grid reusable */}
      <Box hasBottomSpacing={4} hasTopSpacing={4}>
        <HStack hasSpacing>
          <div style={{ width: 100 }} />
          <div style={{ width: '100%' }}>
            <Columns layoutString={'1 1 1'}>
              <Label variant={TextType.Shy} size={LabelSize.Small}>
                Name
              </Label>
              <Label variant={TextType.Shy} size={LabelSize.Small}>
                Version control
              </Label>
              <Label variant={TextType.Shy} size={LabelSize.Small}>
                Contributors
              </Label>
            </Columns>
          </div>
        </HStack>
      </Box>
      <Columns layoutString="1" hasXGap hasYGap>
        {projects.map((project) => (
          <LauncherProjectCard
            key={project.id}
            {...project}
            onClick={() => onLaunchProject(project)}
            contextMenuItems={[
              {
                label: 'Launch project',
                onClick: () => onLaunchProject(project)
              },
              {
                label: 'Open project folder',
                onClick: () => {
                  if (project.localPath) {
                    const shell = require('@electron/remote').shell;
                    shell.showItemInFolder(project.localPath);
                  }
                }
              },
              {
                label: 'Open project settings',
                onClick: () => onOpenProjectSettings(project.id)
              },

              'divider',
              {
                label: 'Remove from list',
                onClick: () => onRemoveProject(project),
                icon: IconName.Trash,
                isDangerous: true
              }
            ]}
          />
        ))}
      </Columns>
    </LauncherPage>
  );
}
