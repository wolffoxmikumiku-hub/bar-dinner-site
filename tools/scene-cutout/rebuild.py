import numpy as np, cv2
from PIL import Image
S="/Users/funakiyui/Desktop/work/Bar&Dinner/bar-dinner-site/public/scenes/"
def extrude(img, hole, region, d, maxk=400, valid=None):
    """fill hole∩region by copying the first non-hole (and valid) pixel found stepping along d (vectorized)"""
    out=img.copy(); H,W=hole.shape
    ys,xs=np.nonzero(hole&region); todo=np.ones(len(ys),bool)
    ok=~hole if valid is None else (~hole&valid)
    dx,dy=d
    for k in range(1,maxk):
        if not todo.any(): break
        qx=np.rint(xs+dx*k).astype(int); qy=np.rint(ys+dy*k).astype(int)
        inb=(qx>=0)&(qy>=0)&(qx<W)&(qy<H)
        todo&=inb|~todo
        sel=todo.copy(); sel[sel]=ok[qy[sel],qx[sel]]
        out[ys[sel],xs[sel]]=img[qy[sel],qx[sel]]
        todo&=~sel
    return out
def line_below(x0,y0,slope,H=768,W=1408):
    yy,xx=np.mgrid[0:H,0:W]; return yy > y0+slope*(xx-x0)
def box(x0,y0,x1,y1,H=768,W=1408):
    m=np.zeros((H,W),bool); m[y0:y1,x0:x1]=True; return m
def poly(pts,H=768,W=1408):
    m=np.zeros((H,W),np.uint8); cv2.fillPoly(m,[np.array(pts,np.int32)],1); return m>0
