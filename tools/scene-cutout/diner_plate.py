from rebuild import *
img=np.array(Image.open(S+'diner-1f.webp').convert('RGB')); hole=np.load('hole-diner-1f.npy')
hole=hole&~box(860,300,1030,540)
import sys
out=img.copy(); s=float(sys.argv[1]) if len(sys.argv)>1 else 0.3; SEAM=654
yy,xx=np.mgrid[0:768,0:1408]
above_counter=yy<456-0.45*(xx-684)
F=((box(SEAM,176,768,480)|(hole&box(SEAM,160,815,480)))&above_counter)
fillmask=F.copy()
out=extrude(out,fillmask,F,(1,-s),valid=~box(748,378,786,462))
# grill edge column left of the seam
hl=hole|box(645,290,SEAM,430)
L_=hl&box(630,176,SEAM,480)&above_counter
out=extrude(out,hl,L_,(-1,0))
# put the mustard bottle back in front
mb=box(655,235,682,295); L=img.astype(int)
must=mb&(L[...,0]>170)&(L[...,1]>110)&(L[...,2]<120)
must=cv2.dilate(must.astype(np.uint8),np.ones((3,3),np.uint8))>0
must&=mb&~hole
out[must]=img[must]
# seam
sm=box(SEAM,176,SEAM+1,480)&above_counter; out[sm]=(out[sm]*0.5).astype(np.uint8)
np.save('plate-wip.npy',out)
Image.fromarray(out).crop((600,150,860,440)).resize((780,870),Image.NEAREST).save('pv-bison.png')
