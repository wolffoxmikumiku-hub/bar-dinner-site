from rebuild import *
base=np.load('plate-wip.npy'); hole=np.load('hole-diner-1f.npy').copy()
hole&=~box(860,300,1030,540)  # owl stays seated: keep original pixels under him
yy0,xx0=np.mgrid[0:768,0:1408]
hole&=~(((xx0>=654)&(xx0<815)&(yy0>=160)&(yy0<456-0.45*(xx0-684))))
out=base.copy(); s=0.45
yy,xx=np.mgrid[0:768,0:1408]
counter_front=poly([(684,456),(812,398),(812,600),(684,606)])
top_left=poly([(665,470),(684,460),(684,512),(665,500)])       # counter-top overhang, left end
left_face=poly([(676,500),(684,504),(684,606),(676,600)])       # thin left end face
counter=counter_front|top_left|left_face
excl=box(748,380,786,468)|box(738,460,784,522)                  # ketchup, tray area
valid=~hole&~excl
out=extrude(out,hole,counter_front,(1,-s),valid=valid&counter_front)
out=extrude(out,hole,top_left,(1,-s),valid=valid&(counter_front|top_left))
# left end face: dark wood with kickplate at the bottom
lf=hole&left_face
wood=np.array([92,52,34]); kick=np.array([120,116,112])
out[lf]=wood
out[lf&(yy>590-0.0*(xx))]=kick
edge=left_face&~cv2.erode(left_face.astype(np.uint8),np.ones((3,3),np.uint8)).astype(bool)
out[edge&hole]=[40,26,20]
# floor: periodic copy on the checker lattice (v1=(0,45), v2=(45,22.5))
back=(xx>=654)&(yy>=398)&(yy<456-0.45*(xx-684))&~counter          # floor strip behind the counter
front=(yy>447-0.55*(xx-660))&~counter&~back
clean=~hole&~excl&~box(750,380,790,460)
srcs={'back':back&clean&box(776,368,870,420),'front':front&clean}
cands=sorted({(a*0+b*45, a*45+round(b*22.5)) for a in range(-4,5) for b in range(-4,5)}-{(0,0)},key=lambda v:v[0]**2+v[1]**2)
for zone,Z in [('front',front)]:
    ok=srcs[zone]; ys,xs=np.nonzero(hole&Z)
    for y,x in zip(ys,xs):
        for dx,dy in cands:
            qx,qy=x+dx,y+dy
            if 0<=qy<768 and 0<=qx<1408 and ok[qy,qx]:
                out[y,x]=base[qy,qx]; break
floor=back|front
# anything left in hole in this zone (grill corner) : from left
rest=hole&box(600,380,720,480)&~floor&~counter
out=extrude(out,hole,rest,(-1,0))
np.save('plate-wip2.npy',out)
Image.fromarray(out).crop((580,380,820,660)).resize((720,840),Image.NEAREST).save('pv-w.png')
