'use client';
import {useMemo} from 'react';
import {MdWeb} from 'react-icons/md';
import {
  BsFileEarmarkWordFill,
  BsFileEarmarkExcelFill,
  BsFileEarmarkPptFill,
  BsFileEarmarkPdfFill,
  BsFileEarmarkZipFill,
  BsFileEarmarkTextFill,
  BsFileEarmarkImageFill,
  BsFileEarmarkPlayFill,
} from 'react-icons/bs';
import type {IconBaseProps} from 'react-icons';

interface FileIconProps extends IconBaseProps {
  fileType?: string | null;
}

export function FileIcon({fileType, fill, ...rest}: FileIconProps) {
  const {Icon, color} = useMemo(() => {
    if (fileType === null || fileType === undefined) {
      return {Icon: MdWeb, color: undefined};
    }

    switch (fileType) {
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/vnd.oasis.opendocument.text':
        return {Icon: BsFileEarmarkWordFill, color: '#0d47a1'};
      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      case 'application/vnd.oasis.opendocument.spreadsheet':
        return {Icon: BsFileEarmarkExcelFill, color: '#2e7d32'};
      case 'application/vnd.ms-powerpoint':
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      case 'application/vnd.oasis.opendocument.presentation':
        return {Icon: BsFileEarmarkPptFill, color: '#b93419'};
      case 'application/pdf':
        return {Icon: BsFileEarmarkPdfFill, color: '#ff5722'};
      case 'application/zip':
      case 'application/gzip':
        return {Icon: BsFileEarmarkZipFill, color: undefined};
      default:
        if (fileType.startsWith('text')) {
          return {Icon: BsFileEarmarkTextFill, color: undefined};
        }
        if (fileType.startsWith('image')) {
          return {Icon: BsFileEarmarkImageFill, color: undefined};
        }
        if (fileType.startsWith('video')) {
          return {Icon: BsFileEarmarkPlayFill, color: undefined};
        }
        return {Icon: MdWeb, color: undefined};
    }
  }, [fileType]);

  return <Icon key={fileType ?? undefined} fill={fill || color} {...rest} />;
}
