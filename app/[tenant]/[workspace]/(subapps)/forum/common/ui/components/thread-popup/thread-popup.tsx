'use client';

import {Swiper, SwiperSlide} from 'swiper/react';
import {Navigation} from 'swiper/modules';

// ---- CORE IMPORTS ---- //
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {Dialog, DialogContent, DialogTitle} from '@/ui/components';

// ---- LOCAL IMPORTS ---- //
import {Thread} from '@/subapps/forum/common/ui/components';
import styles from './styles.module.scss';
import {Image, Post} from '@/subapps/forum/common/types/forum';
import {SUBAPP_CODES} from '@/constants';

export const ThreadPopup = ({
  post,
  open,
  images,
  onClose,
}: {
  post?: Post;
  open: boolean;
  images: any;
  onClose: () => void;
}) => {
  const {workspaceURI} = useWorkspace();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={`${styles['custom-dialog-content']} max-w-[72rem] overflow-hidden px-0 py-0 md:h-full border-none md:rounded-l-xl flex items-center`}>
        <DialogTitle className="hidden" />
        <div className="w-full h-full flex flex-col md:flex-row gap-4">
          <div className=" w-full md:w-1/2 h-[30rem] md:h-full md:pt-0 flex flex-col md:flex-row gap-4 md:mt-0 ">
            <div className="bg-black w-full h-full md:h-auto md:rounded-l-lg md:px-4">
              <Swiper
                style={
                  {
                    '--swiper-navigation-color': '#fff',
                    '--swiper-navigation-size': '20px',
                  } as React.CSSProperties
                }
                centeredSlides={true}
                navigation={true}
                modules={[Navigation]}
                className="mySwiper h-full">
                {images.map((image: Image, index: number) => (
                  <SwiperSlide key={index} className="flex items-center">
                    <div
                      className="w-full h-full bg-no-repeat bg-center"
                      style={{
                        backgroundImage: `url(${workspaceURI}/${SUBAPP_CODES.forum}/api/post/${post?.id}/attachment/${image?.metaFile?.id})`,
                        backgroundSize: '100%',
                      }}></div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
          <div className="md:pt-12 md:pr-4 pb-6 md:pb-0 w-full md:w-1/2 h-[28.125rem] md:h-full overflow-auto">
            <Thread
              post={post}
              showHeader={false}
              showCommentsByDefault={true}
              hideCloseComments={true}
              usePopUpStyles={true}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ThreadPopup;
