import { useState, memo } from 'react';
import styled from 'styled-components';
import FolderClosedIcon from '@/assets/icons/folderClosed.svg?react';
import ThreeDotsIcon from '@/assets/icons/3dots.svg?react';
import SettingIcon from '@/assets/icons/setting.svg?react';
import TrashBinIcon from '@/assets/icons/trashBin.svg?react';
import { DropdownMenu, MobileMenuButton, type DropdownMenuItem } from '@/shared/ui';
import type { Project } from '@/shared/types';

interface ProjectHeaderProps {
  project: Project;
  onEdit: () => void;
  onDelete: () => void;
  onOpenSidebar?: () => void;
}

export const ProjectHeader = memo(function ProjectHeader({
  project,
  onEdit,
  onDelete,
  onOpenSidebar,
}: ProjectHeaderProps) {
  const [menuAnchorRect, setMenuAnchorRect] = useState<DOMRect | null>(null);

  const handleMenuClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuAnchorRect(rect);
  };

  const handleCloseMenu = () => {
    setMenuAnchorRect(null);
  };

  const menuItems: DropdownMenuItem[] = [
    {
      label: '정보 수정',
      icon: <SettingIcon />,
      onClick: onEdit,
    },
    {
      label: '프로젝트 삭제',
      variant: 'danger',
      icon: <TrashBinIcon />,
      onClick: onDelete,
    },
  ];

  return (
    <Container>
      <Inner>
        <LeftArea>
          {onOpenSidebar && <MobileMenuButton onClick={onOpenSidebar} />}
          <TitleSection>
            <IconWrapper aria-hidden="true">
              <FolderClosedIcon />
            </IconWrapper>
            <TitleInfo>
              <ProjectName>{project.name}</ProjectName>
              {project.description && (
                <ProjectDescription>{project.description}</ProjectDescription>
              )}
            </TitleInfo>
          </TitleSection>
        </LeftArea>

        <SettingMenuButton onClick={handleMenuClick} aria-label="프로젝트 설정">
          <ThreeDotsIcon />
        </SettingMenuButton>
      </Inner>

      <DropdownMenu items={menuItems} anchorRect={menuAnchorRect} onClose={handleCloseMenu} />
    </Container>
  );
});

const Container = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border-secondary);
`;

const Inner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 780px;
  width: 100%;
  margin: 0 auto;
  gap: 12px;
`;

const LeftArea = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const TitleSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--color-surface-primary);
  color: var(--color-text-tertiary);

  svg {
    width: 22px;
    height: 22px;
  }
`;

const TitleInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ProjectName = styled.h1`
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
`;

const ProjectDescription = styled.p`
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  margin: 0;
`;

const SettingMenuButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: var(--color-surface-hover);
    color: var(--color-text-primary);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;
